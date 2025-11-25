
import { GoogleGenAI, Type } from "@google/genai";
import { ReportData } from "../types";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const MODEL_NAME = "gemini-2.5-flash";

/**
 * 1. Classify Files
 */
export const classifyFiles = async (
  files: { name: string; mimeType: string; data: string }[],
  checklistItems: { id: string; label: string; description?: string }[]
): Promise<{ originalFileName: string; suggestedName: string; categoryId: string }[]> => {
  try {
    const listContext = checklistItems.map(item => 
      `- ID: "${item.id}" | 名称: "${item.label}" ${item.description ? `(说明: ${item.description})` : ''}`
    ).join('\n');

    const systemInstruction = `你是一个专业的非融资担保业务资料智能分类助手。
    用户将一次性上传多份文件（图片格式），你需要根据每份文件的**实际图像内容**（而非文件名）判断其所属的资料类别。

    **分类规则**：
    1. 必须读取文件图像中的标题、公章、关键条款等信息。
    2. 将文件归类到以下【资料清单】中对应的 ID。
    3. 如果内容明确是"营业执照"，ID必须为 'license'。
    4. 如果内容明确是"公司章程"，ID必须为 'articles'。
    5. **财务报表特别判断**：
       - 如果是2022年或前年度财报，ID为 'finance_prev_year'。
       - 如果是2023年或上年度财报，ID为 'finance_last_year'。
       - 如果是2024年或当期/近期财报，ID为 'finance_current'。
    6. 如果文件无法识别或不属于清单，ID 填 'other_materials'。
    7. **suggestedName**：必须根据内容生成规范的中文文件名（如“2023年审计报告.pdf”、“中标通知书.jpg”）。

    【资料清单】：
    ${listContext}
    - ID: "other_materials" | 名称: 其他资料
    `;

    const parts: any[] = [];
    parts.push({ text: "请分析以下文件，并返回分类结果 JSON：" });

    files.forEach((file, index) => {
      parts.push({ text: `\n[文件 ${index + 1}] 原名: ${file.name}` });
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    });

    const schema = {
      type: Type.OBJECT,
      properties: {
        results: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              originalFileName: { type: Type.STRING },
              suggestedName: { type: Type.STRING },
              categoryId: { type: Type.STRING }
            },
            required: ["originalFileName", "suggestedName", "categoryId"]
          }
        }
      }
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: schema,
      },
      contents: {
        role: "user",
        parts: parts
      }
    });

    return JSON.parse(response.text).results || [];

  } catch (error) {
    console.error("Gemini Classification Failed:", error);
    return files.map(f => ({
      originalFileName: f.name,
      suggestedName: f.name,
      categoryId: 'other_materials'
    }));
  }
};

/**
 * 2. Extract Basic Info
 */
export const extractBasicInfo = async (files: { mimeType: string; data: string }[]): Promise<{ projectName?: string, customerName?: string, amount?: string, beneficiary?: string }> => {
  try {
    const parts: any[] = [];
    parts.push({ text: "请阅读以下所有业务文件，提取关键项目信息：" });

    files.forEach((file) => {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    });

    const schema = {
      type: Type.OBJECT,
      properties: {
        projectName: { type: Type.STRING },
        customerName: { type: Type.STRING },
        amount: { type: Type.STRING },
        beneficiary: { type: Type.STRING },
      }
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      config: {
        systemInstruction: "你是一个信息提取助手。请综合分析所有文件，提取项目名称、客户名称、金额和受益人。",
        responseMimeType: "application/json",
        responseSchema: schema,
      },
      contents: {
        role: "user",
        parts: parts
      }
    });

    return JSON.parse(response.text);

  } catch (error) {
    console.error("Extraction Failed:", error);
    return {};
  }
};

/**
 * 3. Analyze Documents & Generate Report (2024 Revision Format)
 */
export const analyzeDocuments = async (
  files: { mimeType: string; data: string }[],
  feeDescription?: string
): Promise<ReportData> => {
  try {
    const parts: any[] = [];
    const yearLast = (new Date().getFullYear() - 1) + "年";
    const yearCurr = new Date().getFullYear() + "年";

    parts.push({ text: `请作为保函业务评审专家，阅读以下文件，提取真实信息，填入《保函业务简式评审报告（2024年修订版）》。
    
    **重要原则**：
    1. 严格基于文件内容，找不到的数据留空字符串，不要杜撰。
    2. **财务数据填写规范（Strict Rules）**：
       - 表格中的 "yearLast" (2023年) 数据：请从归类为 'finance_last_year' (2023审计报告) 的文件中提取。
       - 表格中的 "yearCurr" (2024年) 数据：请从归类为 'finance_current' (2024报表) 的文件中提取（如果是月报，请注意是否需要年化或直接填期末数）。
       - 表格中的 "value" (当期/实际) 数据：请填入 'finance_current' 中的最新一期期末数。
       - **"change" (增减变动)**：只填正负数字或百分比（如 "+15.2%", "-300"），**严禁出现汉字**（不要写"增加"、"下降"、"减少"）。
       - **"note" (说明)**：**仅在数据异常或揭示风险时填写**（如"亏损严重"、"负债率过高"），如果数据正常或无特殊情况，**必须留空**，严禁单纯重复数字。
    3. 如果用户提供了收费说明：“${feeDescription || '无'}”，请优先用于填写“保函要素”中的费率、收费方式。
    
    **关于“A角履约能力分析”（analysis字段）的特别撰写指令**：
    请严格按照以下【范文参考】的逻辑结构（分为4点+综上结论），结合本项目的实际材料进行撰写。请模仿其专业语气。

    【范文参考】：
    1. 申请人主体合法，成立于[年份]，一直深耕[行业]，具有[资质等级]，具有较好的行业口碑。技术能力属于同行业前列，具备相应履约能力和履约经验，完工风险较小。经营正常，所承接履约项目真实有效。
    2. 项目业主为[业主名称]，属于[机构性质，如政府机构/国企]，[简述业主风险，如：停发农民工工资会引发社会舆论风险，对业主的政府形象有严重损害]，所以业主恶意拖欠可能性极小。
    3. 资金来源为[资金来源]，资金来源稳定，按时支付有保障。[简述支付保障措施，如：本项目采取对农民工工资支付纳入专户管理]。
    4. 为进一步降低项目风险，本项目提供[反担保措施]。[简述反担保具体情况，如：通过调查得知实控人有较强资产实力]。
    综上，经过评估，[风险点]风险可控，建议为[申请人]开立[金额]万元[保函品种]（[担保类型]），受益人：[受益人]，担保期限不超过[日期]，担保费费率[费率]，一次性收取。银行手续费[费率]，按日计算，由我司一次性支付，具体金额以银行提供数据为准。本项目采用[反担保措施]，不存储保证金。

    **撰写要求**：
    - 必须包含上述 1, 2, 3, 4 点及“综上”段落。
    - 结论部分必须明确：建议同意开立、明确费率、明确反担保措施。
    - 适当润色，使其看起来像是有经验的项目经理写的。
    `});

    files.forEach((file) => {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    });

    // Helper for finance schema
    const finRow = {
      type: Type.OBJECT,
      properties: {
        item: { type: Type.STRING },
        yearLast: { type: Type.STRING },
        yearCurr: { type: Type.STRING },
        change: { type: Type.STRING },
        value: { type: Type.STRING },
        note: { type: Type.STRING }
      }
    };

    const schema = {
      type: Type.OBJECT,
      properties: {
        guaranteeInfo: {
          type: Type.OBJECT,
          properties: {
            projectName: { type: Type.STRING },
            beneficiary: { type: Type.STRING },
            productType: { type: Type.STRING },
            guaranteeNature: { type: Type.STRING },
            isHousing: { type: Type.STRING },
            amount: { type: Type.STRING },
            term: { type: Type.STRING },
            rate: { type: Type.STRING },
            feeNote: { type: Type.STRING },
            outstandingBalance: { type: Type.STRING },
            bank: { type: Type.STRING },
            bankFee: { type: Type.STRING },
            chargeMethod: { type: Type.STRING },
          }
        },
        clientInfo: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            established: { type: Type.STRING },
            nature: { type: Type.STRING },
            regCapital: { type: Type.STRING },
            paidCapital: { type: Type.STRING },
            scope: { type: Type.STRING },
            qualifications: { type: Type.STRING },
          }
        },
        shareholders: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              amount: { type: Type.STRING },
              ratio: { type: Type.STRING },
              method: { type: Type.STRING },
              controller: { type: Type.STRING },
              note: { type: Type.STRING },
            }
          }
        },
        financials: {
          type: Type.OBJECT,
          properties: {
            totalAssets: finRow,
            receivables: finRow,
            inventory: finRow,
            netAssets: finRow,
            totalLiabilities: finRow,
            assetLiabRatio: finRow,
            revenue: finRow,
            operatingProfit: finRow,
            netProfit: finRow,
            receivablesTurnover: finRow,
            inventoryTurnover: finRow,
            taxRevenue: finRow,
            creditNotes: { type: Type.STRING, description: "征信查询结果及贷款余额备注" },
          }
        },
        litigation: { type: Type.STRING },
        performance: { type: Type.STRING },
        projectDetails: {
          type: Type.OBJECT,
          properties: {
            owner: { type: Type.STRING },
            funding: { type: Type.STRING },
            location: { type: Type.STRING },
            term: { type: Type.STRING },
            bidAmount: { type: Type.STRING },
            limitPrice: { type: Type.STRING },
            scope: { type: Type.STRING },
            paymentTerms: { type: Type.STRING },
            disclosure: { type: Type.STRING },
          }
        },
        otherMatters: { type: Type.STRING },
        analysis: { type: Type.STRING },
      }
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      config: {
        systemInstruction: "你是一个专业的保函业务审查员。输出JSON必须严格匹配Schema。",
        responseMimeType: "application/json",
        responseSchema: schema,
      },
      contents: {
        role: "user",
        parts: parts
      }
    });

    return JSON.parse(response.text) as ReportData;

  } catch (error) {
    console.error("Report Generation Failed:", error);
    throw error;
  }
};
