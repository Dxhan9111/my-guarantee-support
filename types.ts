
export interface User {
  id: string;
  username: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
}

export enum BondType {
  BID = 'BID', // 投标保函
  PERFORMANCE = 'PERFORMANCE', // 履约保函
  ADVANCE_PAYMENT = 'ADVANCE_PAYMENT', // 预付款保函
  QUALITY = 'QUALITY', // 质量保函
  MIGRANT_WORKER = 'MIGRANT_WORKER', // 农民工工资支付保函
}

export enum ProjectStatus {
  DRAFT = 'Draft', // 草稿
  REVIEWING = 'Reviewing', // 待评审
  APPROVED = 'Approved', // 已通过
  REJECTED = 'Rejected', // 已驳回
  COMPLETED = 'Completed', // 已完成
}

export interface Project {
  id: string;
  name: string;
  bondType: BondType;
  status: ProjectStatus;
  customerName: string;
  amount: number;
  createTime: string;
  updateTime: string;
}

export interface Report {
  id: string;
  projectId: string;
  projectName: string;
  type: BondType;
  version: string;
  generatedAt: string;
  status: 'Generated' | 'Submitted' | 'Archived';
}

export interface OperationLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: string;
}

// --- Strict Report Data Structures (2024 Revision) ---

export interface FinancialRow {
  item: string;      // 项目名称
  yearLast: string;  // 2023年
  yearCurr: string;  // 2024年
  change: string;    // 增减变动
  value: string;     // 当期/实际值
  note: string;      // 说明
}

export interface ShareholderRow {
  name: string;
  amount: string;
  ratio: string;
  method: string; // 出资方式
  controller: string; // 实际控制人
  note: string;
}

export interface ReportData {
  // 1. 保函要素
  guaranteeInfo: {
    projectName: string;
    beneficiary: string;
    productType: string; // 保函品种
    guaranteeNature: string; // 担保类型 (独立/一般)
    isHousing: string; // 是否涉房
    amount: string; // 保函金额
    term: string; // 保函期限
    rate: string; // 担保费率
    feeNote: string; // 费用说明 (一口价/年化...)
    outstandingBalance: string; // 在保余额
    bank: string; // 合作银行
    bankFee: string; // 银行手续费率
    chargeMethod: string; // 收费计算方式 (Merged Cell)
  };

  // 2. 基本情况
  clientInfo: {
    name: string;
    established: string;
    nature: string;
    regCapital: string;
    paidCapital: string;
    scope: string; // 主营业务范围
    qualifications: string; // 企业资质
  };

  // 3. 股权结构
  shareholders: ShareholderRow[];

  // 4. 财务信息
  financials: {
    totalAssets: FinancialRow;
    receivables: FinancialRow;
    inventory: FinancialRow;
    netAssets: FinancialRow;
    totalLiabilities: FinancialRow;
    assetLiabRatio: FinancialRow;
    revenue: FinancialRow;
    operatingProfit: FinancialRow;
    netProfit: FinancialRow;
    receivablesTurnover: FinancialRow;
    inventoryTurnover: FinancialRow;
    taxRevenue: FinancialRow; // 报税收入
    creditNotes: string; // 征信及借款备注 (Footer of finance table)
  };

  // 5. 涉诉情况 (Merged Text)
  litigation: string;

  // 6. 履约经验 (Merged Text)
  performance: string;

  // 7. 项目情况
  projectDetails: {
    owner: string;
    funding: string; // 资金来源
    location: string; // 履约地点
    term: string; // 履约期限
    bidAmount: string; // 中标金额
    limitPrice: string; // 最高限价
    scope: string; // 建设规模/内容
    paymentTerms: string; // 结算/付款方式
    disclosure: string; // 重点披露内容 (预付款/进度款等)
  };

  // 8. 其他事项
  otherMatters: string;

  // 9. 综合分析 (A角)
  analysis: string;
  
  // 10. 审批签字
  signatures?: {
    manager: string;
    deptHead: string;
    independent: string;
    approver: string;
  };
}

export const BondTypeLabels: Record<BondType, string> = {
  [BondType.BID]: '投标保函',
  [BondType.PERFORMANCE]: '履约保函',
  [BondType.ADVANCE_PAYMENT]: '预付款保函',
  [BondType.QUALITY]: '质量保函',
  [BondType.MIGRANT_WORKER]: '农民工工资支付保函',
};

export const BondTypeDescriptions: Record<BondType, string> = {
  [BondType.BID]: '用于投标过程中，保证投标人中标后履行签约义务。',
  [BondType.PERFORMANCE]: '保证合同义务的履行，保障受益人权益。',
  [BondType.ADVANCE_PAYMENT]: '保证承包人正确使用预付款，按约施工。',
  [BondType.QUALITY]: '保证工程或产品质量符合合同约定标准。',
  [BondType.MIGRANT_WORKER]: '保障农民工工资按时足额支付，防止欠薪。',
};
