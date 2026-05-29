import type {
  StudentInfo,
  SchoolRecommendation,
  SchoolDetail,
  ChatMessage,
  KnowledgeSource,
  AgentResponse,
  AgentStep,
  AgentMode,
} from '@/types'

// ─── 默认学生信息 ──────────────────────────────────────────
export const mockStudentInfo: StudentInfo = {
  province: '湖南',
  score: 568,
  rank: 15000,
  subjects: ['物理', '化学', '生物'],
  targetCities: ['武汉', '长沙', '成都'],
  majorPreference: '计算机/电子信息',
  schoolPreference: '211',
  careAboutPostgrad: true,
  riskPreference: '稳妥',
  educationGoal: '保研',
}

// ─── 推荐院校列表（10条）────────────────────────────────────
export const mockRecommendations: SchoolRecommendation[] = [
  // ── 冲刺 ────────────────────────────────────────────────
  {
    id: 'school_001',
    matchScore: 93,
    schoolName: '西安交通大学',
    recommendedMajor: '自动化类',
    city: '西安',
    schoolLevel: '985/211',
    category: '冲刺',
    admissionRisk: '高',
    lastYearScore: 588,
    lastYearRank: 10000,
    postgradAdvantage: '保研率 22%，推荐清北直博',
    reason: '顶尖985，自动化学科排名前3，保研通道畅通，是冲击高层次升学的最优选',
  },
  {
    id: 'school_002',
    matchScore: 91,
    schoolName: '电子科技大学',
    recommendedMajor: '电子信息类',
    city: '成都',
    schoolLevel: '985/211',
    category: '冲刺',
    admissionRisk: '高',
    lastYearScore: 581,
    lastYearRank: 12000,
    postgradAdvantage: '保研率 25%，电子方向保研竞争力强',
    reason: '电子信息领域985高校，成都城市优势，电子/计算机保研率居全国前列',
  },
  {
    id: 'school_003',
    matchScore: 88,
    schoolName: '北京邮电大学',
    recommendedMajor: '计算机类',
    city: '北京',
    schoolLevel: '211',
    category: '冲刺',
    admissionRisk: '中',
    lastYearScore: 576,
    lastYearRank: 13500,
    postgradAdvantage: '保研率 18%，北京地域优势显著',
    reason: 'ICT领域顶尖211，北京地缘优势，毕业生保研/就业极具竞争力',
  },
  // ── 稳妥 ────────────────────────────────────────────────
  {
    id: 'school_004',
    matchScore: 86,
    schoolName: '中南大学',
    recommendedMajor: '计算机类',
    city: '长沙',
    schoolLevel: '211',
    category: '稳妥',
    admissionRisk: '低',
    lastYearScore: 571,
    lastYearRank: 14000,
    postgradAdvantage: '保研率 16%，湖南本地优势明显',
    reason: '湖南头部211，计算机专业实力强，本省考生录取有一定优势',
  },
  {
    id: 'school_005',
    matchScore: 84,
    schoolName: '湖南大学',
    recommendedMajor: '电子信息类',
    city: '长沙',
    schoolLevel: '211',
    category: '稳妥',
    admissionRisk: '低',
    lastYearScore: 569,
    lastYearRank: 14800,
    postgradAdvantage: '保研率 15%，强基班保研率超50%',
    reason: '双一流211高校，电子信息实力稳定，长沙本地生活成本低，性价比极高',
  },
  {
    id: 'school_006',
    matchScore: 82,
    schoolName: '华南理工大学',
    recommendedMajor: '自动化类',
    city: '广州',
    schoolLevel: '211',
    category: '稳妥',
    admissionRisk: '低',
    lastYearScore: 567,
    lastYearRank: 15500,
    postgradAdvantage: '保研率 14%，粤港澳大湾区就业优势',
    reason: '华南重点211，自动化工科实力突出，大湾区区位优势强，保研质量高',
  },
  {
    id: 'school_007',
    matchScore: 80,
    schoolName: '合肥工业大学',
    recommendedMajor: '计算机类',
    city: '合肥',
    schoolLevel: '211',
    category: '稳妥',
    admissionRisk: '低',
    lastYearScore: 565,
    lastYearRank: 16000,
    postgradAdvantage: '保研率 12%，中科大联培机会多',
    reason: '工科实力强劲的211，与中科大同城，具有跨校联培保研机会',
  },
  // ── 保底 ────────────────────────────────────────────────
  {
    id: 'school_008',
    matchScore: 77,
    schoolName: '南京邮电大学',
    recommendedMajor: '电子信息类',
    city: '南京',
    schoolLevel: '双一流',
    category: '保底',
    admissionRisk: '低',
    lastYearScore: 558,
    lastYearRank: 18000,
    postgradAdvantage: '保研率 10%，电信行业认可度高',
    reason: '通信领域知名高校，南京城市优势，电子信息就业率高',
  },
  {
    id: 'school_009',
    matchScore: 73,
    schoolName: '燕山大学',
    recommendedMajor: '计算机类',
    city: '秦皇岛',
    schoolLevel: '双一流',
    category: '保底',
    admissionRisk: '低',
    lastYearScore: 552,
    lastYearRank: 20000,
    postgradAdvantage: '保研率 8%，机械/计算机老牌强校',
    reason: '工科底蕴深厚，录取分数低，适合分数区间偏下时作为稳妥保底选择',
  },
  {
    id: 'school_010',
    matchScore: 70,
    schoolName: '长沙理工大学',
    recommendedMajor: '自动化',
    city: '长沙',
    schoolLevel: '普通本科',
    category: '保底',
    admissionRisk: '低',
    lastYearScore: 548,
    lastYearRank: 22000,
    postgradAdvantage: '保研率 6%，本省升学通道顺畅',
    reason: '湖南本地高校，录取稳定，交通/电力工科特色突出，适合分数偏低时保底',
  },
]

// ─── 院校详情（前5条推荐对应）──────────────────────────────
export const mockSchoolDetails: SchoolDetail[] = [
  {
    id: 'school_001',
    schoolName: '西安交通大学',
    city: '西安',
    province: '陕西',
    schoolLevel: '985/211',
    introduction:
      '西安交通大学是国家"双一流"A类高校，"985工程"、"211工程"重点建设大学。学校创建于1896年，是我国西部科技创新中心，在工科、医科、管理科学等领域具有重要影响力。',
    disciplineStrengths: ['自动化', '电气工程', '机械工程', '计算机科学', '能源动力', '材料科学'],
    majorDetail: {
      name: '自动化（电气信息类）',
      introduction:
        '西安交通大学自动化专业创建于1956年，是国家一流本科专业建设点。专业围绕"控制与决策"核心，培养具备系统分析、建模与控制能力的高素质工程人才。',
      trainingDirection:
        '控制理论与工程、人工智能与机器学习、嵌入式系统与工业物联网、机器人与智能制造、电力系统自动化',
      employmentDirection:
        '航空航天、新能源、智能制造、人工智能企业；国家电网、中国航天、华为、腾讯、字节跳动等头部企业',
      postgradDirection:
        '本校直博/推免占主流，外推至清华、北大、浙大、中科院等顶尖院所，海外申请密歇根、卡内基梅隆等名校',
      postgradRate: 22,
      collegeName: '电气工程学院',
      collegePostgradRate: 28,
      majorPostgradRate: 32,
      honorsClassRate: 55,
      postgradPolicy:
        '保研资格认定：综合成绩前30%有资格参与；强基班、钱学森实验班优先推荐；校内推免比例约占毕业生的22%；鼓励赴国内外顶尖高校和科研机构深造',
      scholarship:
        '国家奖学金8000元/年；校级一等奖学金3000元/年；特等奖学金6000元/年（前1%）；社会奖学金覆盖超30%学生',
      gradeCalculation:
        '综合测评成绩 = 学业绩点（70%）+ 科研/竞赛加分（20%）+ 综合素质评分（10%）；GPA计算采用4.3制',
      graduationRequirements:
        '毕业总学分≥170学分；英语四级成绩需达到425分；需完成毕业设计并通过答辩；参加学校组织的思政教育不少于32学时',
      majorTransferPolicy:
        '大一结束可申请院内转专业，大二结束可申请跨院转专业；综合成绩排名前20%方可提出申请；热门专业（计算机等）竞争激烈',
      postgradEvaluation: {
        overallScore: 7.9,
        comment: '西安交大该专业保研体系成熟，机会丰富、去向优质，但竞争较激烈；适合有规划意识、能稳定保持 GPA 前 30% 的学生。',
        dimensions: [
          {
            id: 'opportunity',
            name: '推免机会',
            score: 8.5,
            reasoning: '该专业保研率稳定在 32%，特色班可达 55%，整体名额充足',
            rawData: [
              { label: '学院保研率', value: '28%' },
              { label: '专业保研率', value: '32%' },
              { label: '特色班保研率', value: '55%' },
              { label: '近年推免人数', value: '~120 人/年' },
            ],
            source: '西安交通大学 2024 年推免实施细则',
          },
          {
            id: 'competition',
            name: '竞争友好度',
            score: 6.0,
            reasoning: '热门专业生源 GPA 集中度高，但有强基/钱学森班分流，普通班竞争压力中等',
            rawData: [
              { label: '专业热门度', value: '★★★★★' },
              { label: '生源 GPA 分布', value: '集中 3.5-4.0' },
              { label: '保研名额竞争比', value: '约 3:1' },
              { label: '实验班分流', value: '钱学森班 / 强基班 / 少年班' },
            ],
            source: '校友会调研 + 教务处公开数据',
          },
          {
            id: 'controllability',
            name: '成绩可控性',
            score: 7.5,
            reasoning: '保研主要看综合测评（学业 70% + 科研 20% + 综合 10%），规则清晰可提前规划',
            rawData: [
              { label: '保研核心指标', value: '综合测评排名' },
              { label: '学业成绩占比', value: '70%' },
              { label: 'GPA 制度', value: '4.3 制' },
              { label: '挂科风险', value: '中（高数 / 大物 较难）' },
            ],
            source: '西安交通大学 2024 版本科生学籍管理办法',
          },
          {
            id: 'extra',
            name: '科研竞赛加分空间',
            score: 8.5,
            reasoning: '电气学院实验室资源丰富，全国大赛保研加分政策明确，对加分大方',
            rawData: [
              { label: '国家级实验室', value: '电力设备电气绝缘国家重点实验室' },
              { label: '主流竞赛加分', value: '全国大学生电子设计大赛 +3 分' },
              { label: '科研项目机会', value: '大三起可加入导师课题组' },
              { label: '本科生发表', value: '约 5% 学生发表 SCI/EI' },
            ],
            source: '西安交通大学电气工程学院 2024 年保研加分办法',
          },
          {
            id: 'destination',
            name: '升学去向质量',
            score: 9.0,
            reasoning: '本校直博比例高，外推清北、中科院、海外名校占比可观',
            rawData: [
              { label: '本校直博占比', value: '~40%' },
              { label: 'C9 联盟去向', value: '~25%' },
              { label: '中科院 / 工程院', value: '~10%' },
              { label: '海外 Top50', value: '~8%' },
            ],
            source: '西安交大 2024 届毕业生升学统计公报',
          },
        ],
      },
    },
    personalizedAdvice:
      '你的分数(568分，位次15000)冲刺西安交大具有一定风险，但并非不可能。建议同时关注自动化和电气工程两个专业，自动化更热门但竞争更激烈。若选择报考，建议作为冲刺志愿，同时配置中南大学/湖南大学作为稳妥选项。西安交大的保研率高达22%，对于目标保研的你来说是极具吸引力的平台，一旦进入，保研资源非常丰富。',
  },
  {
    id: 'school_002',
    schoolName: '电子科技大学',
    city: '成都',
    province: '四川',
    schoolLevel: '985/211',
    introduction:
      '电子科技大学（UESTC）是我国唯一以电子信息为核心的985高校，在电子科学与技术、信息与通信工程领域实力雄厚。位于成都，城市生活便利，毕业生广受国内外顶尖企业青睐。',
    disciplineStrengths: ['电子科学与技术', '信息与通信工程', '计算机科学', '集成电路', '网络空间安全'],
    majorDetail: {
      name: '电子信息工程',
      introduction:
        '国家一流本科专业，连续多年排名全国第1。专业以信号处理、通信系统、微波技术为核心，融合人工智能与大数据方向，是进入通信/芯片/AI行业的黄金通道。',
      trainingDirection:
        '通信系统与信号处理、集成电路设计、嵌入式与物联网、雷达与无线传感、人工智能与大数据',
      employmentDirection:
        '华为、中兴、大疆、OPPO、魅族等通信/消费电子企业；中国电子、航天科工等国企；海外顶尖芯片公司（英特尔、高通、博通等）',
      postgradDirection:
        '校内直博比例约30%；外推至清华、北大、浙大、中科院、华中科技大学；海外申请南洋理工、悉尼大学、帝国理工',
      postgradRate: 25,
      collegeName: '信息与通信工程学院',
      collegePostgradRate: 32,
      majorPostgradRate: 38,
      honorsClassRate: 58,
      postgradPolicy:
        '保研资格：综合绩点前25%学生可参与；英才实验班、未来精英班全部保研；参加竞赛获奖者综合测评可加分；鼓励赴世界顶尖高校交流访学',
      scholarship:
        '国家奖学金8000元/年；校级特等奖学金10000元/年（前3%）；电子信息行业企业奖学金约5000-20000元；助学贷款和勤工助学机会充足',
      gradeCalculation:
        '综合排名 = 学业绩点（65%）+ 科研/竞赛（25%）+ 文体活动（10%）；全程4.0制绩点；挂科须重修',
      graduationRequirements:
        '修满168学分；英语四级成绩≥425分；毕业设计答辩通过；完成不少于1学期的工程实习',
      majorTransferPolicy:
        '前两学期内可申请系内转专业；全校转专业在大一期末进行；英才班/竞赛班学生享有优先权',
      postgradEvaluation: {
        overallScore: 8.0,
        comment: '电科大电子信息保研生态在国内顶尖，名额、加分政策、去向都极有竞争力；适合目标明确投身电子/通信/AI 行业的学生。',
        dimensions: [
          {
            id: 'opportunity',
            name: '推免机会',
            score: 9.0,
            reasoning: '电科大整体保研率 25%，电子信息工程专业 38%，英才班接近 60%',
            rawData: [
              { label: '学院保研率', value: '32%' },
              { label: '专业保研率', value: '38%' },
              { label: '英才实验班保研率', value: '58%' },
              { label: '近年推免人数', value: '~180 人/年' },
            ],
            source: '电子科技大学 2024 年推免生工作实施细则',
          },
          {
            id: 'competition',
            name: '竞争友好度',
            score: 6.5,
            reasoning: '行业热度高，但英才班/未来精英班直接保研，缓解了普通班竞争',
            rawData: [
              { label: '专业热门度', value: '★★★★★' },
              { label: '生源 GPA 分布', value: '集中 3.6-4.0' },
              { label: '保研名额竞争比', value: '约 2.5:1' },
              { label: '实验班分流', value: '英才实验班 / 未来精英班' },
            ],
            source: '电科大教务处 + 校友会调研',
          },
          {
            id: 'controllability',
            name: '成绩可控性',
            score: 7.0,
            reasoning: '综合排名公式偏重学业（65%），但竞赛科研占比 25% 高于其他学校',
            rawData: [
              { label: '保研核心指标', value: '综合测评排名' },
              { label: '学业成绩占比', value: '65%' },
              { label: 'GPA 制度', value: '4.0 制' },
              { label: '挂科风险', value: '中（电路 / 信号系统 较难）' },
            ],
            source: '电科大本科生培养方案',
          },
          {
            id: 'extra',
            name: '科研竞赛加分空间',
            score: 9.0,
            reasoning: '电子设计大赛、ACM、信安等含金量赛事密集，加分政策给力',
            rawData: [
              { label: '国家级实验室', value: '电磁辐射控制材料国家工程实验室' },
              { label: '主流竞赛加分', value: '全国电赛国一 +3 分' },
              { label: '科研项目机会', value: '大二即可加入实验室' },
              { label: '本科生发表', value: '约 8% 学生有 SCI/EI' },
            ],
            source: '电科大保研加分政策 2024 版',
          },
          {
            id: 'destination',
            name: '升学去向质量',
            score: 8.5,
            reasoning: '本校直博 + 清北/中科院 + 海外名校均有可观比例',
            rawData: [
              { label: '本校直博占比', value: '~50%' },
              { label: 'C9 联盟去向', value: '~20%' },
              { label: '中科院相关所', value: '~12%' },
              { label: '海外 Top50', value: '~10%' },
            ],
            source: '电科大 2024 届毕业生升学统计',
          },
        ],
      },
    },
    personalizedAdvice:
      '电子科大是你最应重点考虑的冲刺高校之一。以568分、位次15000在湖南冲刺电科大有较大可能性，尤其是电子信息类专业。成都的生活节奏与长沙相近，城市适应成本低。电科大的保研率高达25%，且电子/通信方向就业极强，对于重视保研和就业的你而言是最优的冲刺选择。建议关注电科大的"英才实验班"——每年60名，保研率接近100%。',
  },
  {
    id: 'school_004',
    schoolName: '中南大学',
    city: '长沙',
    province: '湖南',
    schoolLevel: '211',
    introduction:
      '中南大学是教育部直属综合性大学，"985工程"、"211工程"重点建设高校。学校以工科和医科著称，计算机、材料、冶金等学科在全国名列前茅，是湖南最顶尖的综合高校。',
    disciplineStrengths: ['计算机科学', '材料科学', '冶金工程', '交通运输', '临床医学', '轨道交通'],
    majorDetail: {
      name: '计算机科学与技术',
      introduction:
        '国家一流本科专业，教育部B+级学科。重点方向包括人工智能、网络安全、大数据、分布式系统，配备大量实验室资源和企业联合培养项目。',
      trainingDirection:
        '人工智能与机器学习、网络安全与密码学、大数据与云计算、软件工程与系统设计、嵌入式与物联网',
      employmentDirection:
        '腾讯、阿里、百度、华为、网易、中南地区银行及国企IT部门；本地城市轨道交通与高铁技术部门',
      postgradDirection:
        '推免至本校、北航、浙大、同济、武汉大学、电子科大等；海外申请以美国、英国高校为主',
      postgradRate: 16,
      collegeName: '计算机学院',
      collegePostgradRate: 20,
      majorPostgradRate: 25,
      honorsClassRate: 45,
      postgradPolicy:
        '保研资格：综合成绩前20%可参与；学院有专项科研项目可加分；与中科院、北航等有联合培养名额；推免生每年约50人',
      scholarship:
        '国家奖学金8000元/年；学校一等奖学金2400元/年；企业冠名奖学金（腾讯、华为等）；生活补贴类助学金种类丰富',
      gradeCalculation:
        '综合测评 = GPA（70%）+ 竞赛/科研（20%）+ 综合表现（10%）；4.0制GPA；补考成绩按60分记录',
      graduationRequirements:
        '毕业学分≥165学分；英语四级必须通过；毕业论文需经查重（相似度<30%）；参加专业实习不少于8周',
      majorTransferPolicy:
        '大一末可申请校内转专业；医学类专业对外开放转入名额极少；计算机为热门专业，转入竞争激烈',
      postgradEvaluation: {
        overallScore: 7.4,
        comment: '中南综合实力均衡，保研机会稳健、竞争友好度较高、规则透明；是想要稳妥推免、避开顶尖名校激烈竞争的优选。',
        dimensions: [
          {
            id: 'opportunity',
            name: '推免机会',
            score: 7.0,
            reasoning: '学校 16% + 学院 20% + 专业 25%，比顶尖 985 低但绝对名额仍可观',
            rawData: [
              { label: '学院保研率', value: '20%' },
              { label: '专业保研率', value: '25%' },
              { label: '特色班保研率', value: '45%' },
              { label: '近年推免人数', value: '~50 人/年（计算机院）' },
            ],
            source: '中南大学计算机学院 2024 年推免实施办法',
          },
          {
            id: 'competition',
            name: '竞争友好度',
            score: 7.5,
            reasoning: '生源压力小于 C9，分流机制明确，普通学生有较大上升空间',
            rawData: [
              { label: '专业热门度', value: '★★★★' },
              { label: '生源 GPA 分布', value: '分布较均匀' },
              { label: '保研名额竞争比', value: '约 2:1' },
              { label: '实验班分流', value: '计算机拔尖班' },
            ],
            source: '中南教务处公开统计',
          },
          {
            id: 'controllability',
            name: '成绩可控性',
            score: 8.0,
            reasoning: '综合测评以 GPA 为主（70%），规则透明，挂科机制宽松',
            rawData: [
              { label: '保研核心指标', value: '综合测评排名' },
              { label: '学业成绩占比', value: '70%' },
              { label: 'GPA 制度', value: '4.0 制' },
              { label: '挂科风险', value: '低（补考后按 60 分记录）' },
            ],
            source: '中南大学本科生培养方案',
          },
          {
            id: 'extra',
            name: '科研竞赛加分空间',
            score: 7.0,
            reasoning: '与中科院、北航有联培项目，加分机制清晰但赛事密度低于电科大',
            rawData: [
              { label: '国家级实验室', value: '高性能复杂制造国家重点实验室' },
              { label: '主流竞赛加分', value: 'ACM 国一 +2 分' },
              { label: '科研项目机会', value: '联培项目 12 个名额' },
              { label: '本科生发表', value: '约 4% 学生有 SCI/EI' },
            ],
            source: '中南大学 2024 年保研补充加分细则',
          },
          {
            id: 'destination',
            name: '升学去向质量',
            score: 7.5,
            reasoning: '推免至北航、浙大、同济、武大等，去向质量好',
            rawData: [
              { label: '本校直博占比', value: '~35%' },
              { label: 'C9 联盟去向', value: '~15%' },
              { label: '中科院 / 北航联培', value: '~10%' },
              { label: '海外 Top100', value: '~5%' },
            ],
            source: '中南计算机学院 2024 届升学统计',
          },
        ],
      },
    },
    personalizedAdvice:
      '对湖南考生而言，中南大学是性价比最高的稳妥选择之一。你的568分、位次15000相比往年中南大学计算机录取线(571分，位次14000)仅差一点点，属于边缘地带，报考有一定风险但概率合理。建议选择计算机或电子信息类（后者录取可能更宽松）。如果你主要目标是保研，中南的16%保研率加上与北航、浙大等的联培机会，能让你在保研赛道上很有竞争力。',
  },
  {
    id: 'school_005',
    schoolName: '湖南大学',
    city: '长沙',
    province: '湖南',
    schoolLevel: '211',
    introduction:
      '湖南大学是教育部直属重点综合大学，"985工程"、"211工程"建设高校，坐落于长沙岳麓山下。学校工科与设计艺术类专业全国领先，人文社科底蕴深厚，是湖南本地优质高校代表。',
    disciplineStrengths: ['电气工程', '机械工程', '土木工程', '经济学', '工业设计', '信息技术'],
    majorDetail: {
      name: '电子信息工程',
      introduction:
        '湖南大学电子信息工程专业是省级一流专业建设点，与电气工程强强联合，形成湖南大学特色的"电力电子+智能控制"培养模式，是湖南地区重点培养方向。',
      trainingDirection:
        '智能电网与电力电子、嵌入式系统与物联网、通信与信号处理、集成电路设计、新能源汽车电子',
      employmentDirection:
        '国家电网、中国电建、比亚迪、宁德时代、博世等电气/新能源企业；长沙及周边高新技术产业园区企业',
      postgradDirection:
        '推免至浙大、电子科大、湖南大学本校、南京大学等；就业型选择航天科工、中广核等',
      postgradRate: 15,
      collegeName: '电气与信息工程学院',
      collegePostgradRate: 18,
      majorPostgradRate: 22,
      honorsClassRate: 52,
      postgradPolicy:
        '保研资格：综合成绩前20%可参与；强基班（每年招收约30人）保研率极高；与多所顶尖高校有签约联培名额；积极参与竞赛可提升综合排名',
      scholarship:
        '国家奖学金8000元/年；校级一等奖学金2000元/年；企业奖学金（比亚迪、宁德时代等新能源企业）；贫困生补贴覆盖面广',
      gradeCalculation:
        '综合成绩 = 学业绩点（75%）+ 实践/竞赛（15%）+ 文体活动（10%）；4.0制GPA；不及格须重修',
      graduationRequirements:
        '毕业学分≥170学分；英语四级≥425分；完成毕业设计并通过答辩；参加至少1次大型创新创业项目',
      majorTransferPolicy:
        '大一结束可申请院内转专业；综合成绩前30%方可申请；工科转工科相对宽松，跨大类转专业需特别申请',
      postgradEvaluation: {
        overallScore: 7.6,
        comment: '湖大特点是强基班保研率极高 + 本地生源友好 + 规则透明，是湖南本地考生上行通道最丝滑的选择之一。',
        dimensions: [
          {
            id: 'opportunity',
            name: '推免机会',
            score: 6.5,
            reasoning: '专业保研 22% 中等水平，但强基班高达 52%，名额向特色班倾斜',
            rawData: [
              { label: '学院保研率', value: '18%' },
              { label: '专业保研率', value: '22%' },
              { label: '强基班保研率', value: '52%' },
              { label: '近年推免人数', value: '~40 人/年（电气院）' },
            ],
            source: '湖南大学电气与信息工程学院 2024 推免实施办法',
          },
          {
            id: 'competition',
            name: '竞争友好度',
            score: 8.0,
            reasoning: '本地生源占比高，竞争压力较小，强基班单独排名',
            rawData: [
              { label: '专业热门度', value: '★★★★' },
              { label: '生源 GPA 分布', value: '正态分布较好' },
              { label: '保研名额竞争比', value: '约 1.5:1' },
              { label: '实验班分流', value: '强基班 / 卓越工程师班' },
            ],
            source: '湖南大学教务处统计',
          },
          {
            id: 'controllability',
            name: '成绩可控性',
            score: 8.5,
            reasoning: '综合评定学业占比高（75%），强基班有专门学业辅导',
            rawData: [
              { label: '保研核心指标', value: '学业成绩排名' },
              { label: '学业成绩占比', value: '75%' },
              { label: 'GPA 制度', value: '4.0 制' },
              { label: '挂科风险', value: '低（强基班有补习）' },
            ],
            source: '湖南大学 2024 版本科生培养方案',
          },
          {
            id: 'extra',
            name: '科研竞赛加分空间',
            score: 7.5,
            reasoning: '电气工程实验室资源好，新能源企业合作多',
            rawData: [
              { label: '国家级实验室', value: '汽车车身先进设计制造国家重点实验室' },
              { label: '主流竞赛加分', value: '电赛省一 +1 分' },
              { label: '科研项目机会', value: '强基班大二可申请' },
              { label: '校企联合项目', value: '比亚迪、宁德时代' },
            ],
            source: '湖南大学 2024 保研加分政策',
          },
          {
            id: 'destination',
            name: '升学去向质量',
            score: 7.5,
            reasoning: '主要去向浙大、电科大、本校直博，海外申请较少',
            rawData: [
              { label: '本校直博占比', value: '~45%' },
              { label: '985 名校去向', value: '~30%' },
              { label: '中科院相关所', value: '~5%' },
              { label: '海外名校', value: '~3%' },
            ],
            source: '湖南大学 2024 届升学报告',
          },
        ],
      },
    },
    personalizedAdvice:
      '湖南大学是你最稳妥的选择，你的568分（位次15000）与往年湖南大学电子信息类录取线（569分，位次14800）非常接近。作为湖南本地985高校，你有明显的地域优势。湖南大学的"强基班"是一个值得关注的机会——强基班保研率超52%，且有额外的学业辅导和竞赛支持，非常适合你的保研目标。建议将湖南大学作为核心稳妥志愿，搭配1-2个冲刺志愿和1个保底志愿。',
  },
  {
    id: 'school_008',
    schoolName: '南京邮电大学',
    city: '南京',
    province: '江苏',
    schoolLevel: '双一流',
    introduction:
      '南京邮电大学是工业和信息化部、教育部共建高校，以信息与通信技术为特色，在物联网、通信工程、信息安全等领域具有全国领先地位。学校地处南京，周边产业配套完善。',
    disciplineStrengths: ['通信工程', '信息安全', '物联网工程', '微电子科学与工程', '人工智能'],
    majorDetail: {
      name: '电子信息工程',
      introduction:
        '南邮电子信息工程专业是学校的王牌专业，依托通信部背景，在无线通信、信号处理、物联网方向具有明显优势，就业市场认可度高。',
      trainingDirection:
        '无线通信与5G技术、物联网系统设计、信号处理与传感网、图像与多媒体处理、智慧城市与边缘计算',
      employmentDirection:
        '华为、中兴、爱立信、三星研究院；运营商（中国移动、中国电信）；物联网创业公司；信息安全企业',
      postgradDirection:
        '推免至东南大学、南京大学、浙大；部分学生赴英国、澳大利亚名校深造；就业方向通信行业大厂为主',
      postgradRate: 10,
      collegeName: '电子与光学工程学院',
      collegePostgradRate: 13,
      majorPostgradRate: 15,
      honorsClassRate: 38,
      postgradPolicy:
        '综合成绩前15%可申请推免；与华为等企业有定向联培项目（不纳入推免名额）；设有专项学术竞赛加分政策；鼓励跨学科联合培养',
      scholarship:
        '国家奖学金8000元/年；华为、中兴等企业奖学金5000-10000元/年；通信行业协会奖学金；贫困补助种类多',
      gradeCalculation:
        '综合排名 = GPA（70%）+ 科研竞赛（20%）+ 文体活动（10%）；4.0制；补考按实际成绩记录',
      graduationRequirements:
        '修满162学分；英语四级≥425分；毕业设计查重通过；参加企业实习不少于6周',
      majorTransferPolicy:
        '大一末可申请院内转专业（名额有限）；跨院转专业较难；信息安全专业有保密要求，转出申请需审核',
      postgradEvaluation: {
        overallScore: 7.2,
        comment: '南邮保研名额不算多，但行业定向培养项目（华为等）非常有特色，竞争压力小，适合行业方向明确的同学。',
        dimensions: [
          {
            id: 'opportunity',
            name: '推免机会',
            score: 5.0,
            reasoning: '专业保研率 15%，低于头部 211，但行业定向项目可作为替代上行通道',
            rawData: [
              { label: '学院保研率', value: '13%' },
              { label: '专业保研率', value: '15%' },
              { label: '英才班保研率', value: '38%' },
              { label: '近年推免人数', value: '~25 人/年' },
            ],
            source: '南京邮电大学 2024 推免实施细则',
          },
          {
            id: 'competition',
            name: '竞争友好度',
            score: 8.5,
            reasoning: '生源压力较小，行业定向班单独占用名额减轻普通生竞争',
            rawData: [
              { label: '专业热门度', value: '★★★' },
              { label: '生源 GPA 分布', value: '分布均匀' },
              { label: '保研名额竞争比', value: '约 1.2:1' },
              { label: '实验班分流', value: '华为定向班 / 信安特长班' },
            ],
            source: '南邮教务处招生数据',
          },
          {
            id: 'controllability',
            name: '成绩可控性',
            score: 7.5,
            reasoning: 'GPA 占 70%，规则透明，但需要严格保持前 15%',
            rawData: [
              { label: '保研核心指标', value: '综合排名' },
              { label: '学业成绩占比', value: '70%' },
              { label: 'GPA 制度', value: '4.0 制' },
              { label: '挂科风险', value: '中（信号系统、通信原理较难）' },
            ],
            source: '南邮本科生培养方案',
          },
          {
            id: 'extra',
            name: '科研竞赛加分空间',
            score: 8.0,
            reasoning: '与华为等通信企业有定向联培项目（不占推免名额），等同于额外通道',
            rawData: [
              { label: '国家级实验室', value: '宽带无线通信与传感网技术教育部重点实验室' },
              { label: '主流竞赛加分', value: '电信杯、信安大赛' },
              { label: '科研项目机会', value: '华为定向班 ~30 人/年' },
              { label: '本科生发表', value: '约 3% 学生有 EI' },
            ],
            source: '南邮 2024 保研补充政策',
          },
          {
            id: 'destination',
            name: '升学去向质量',
            score: 7.0,
            reasoning: '主要推免至东南、南大、浙大，海外较少但通信行业认可度高',
            rawData: [
              { label: '本校直博占比', value: '~30%' },
              { label: '东南 / 南大去向', value: '~25%' },
              { label: '浙大 / 上交去向', value: '~10%' },
              { label: '海外名校', value: '~5%' },
            ],
            source: '南邮 2024 届升学统计',
          },
        ],
      },
    },
    personalizedAdvice:
      '南京邮电大学是你作为保底志愿的理想选择。568分（位次15000）高出往年南邮录取线约10分，录取确定性很高。南邮的通信特色强，以电子信息工程为跳板，就业进入运营商/通信大厂非常顺畅。虽然保研率（10%）不如顶尖211，但南邮以"行业定向培养"见长，如果未来就业倾向于通信行业，南邮是一个非常务实的选择。',
  },
]

// ─── AI 回复模板（关键词匹配）─────────────────────────────
export const mockAIResponses: Record<string, string> = {
  postgrad:
    '根据你的情况（568分，湖南，物化生），在保研赛道上有以下建议：\n\n**1. 优先选择保研率高的学校**\n电子科技大学（25%）> 西安交通大学（22%）> 中南大学（16%）> 湖南大学（15%）\n\n**2. 关注"特色班/实验班"**\n特色班保研率普遍在40-60%，远高于普通班。电科大英才实验班和湖南大学强基班都值得重点关注。\n\n**3. 保研竞争核心指标**\n大学期间GPA排名是第一要素，建议入学后将前两年成绩排名作为核心目标，同时积累1-2个国家级竞赛奖项。\n\n📌 **参考来源：** 2024年各校推免保研统计数据',

  admission:
    '根据2024年湖南省高考录取数据，以下是你关注院校的参考信息：\n\n| 院校 | 往年分数线 | 往年位次 | 你的分差 |\n|------|-----------|---------|--------|\n| 西安交大 | 588 | 10000 | -20分 |\n| 电子科大 | 581 | 12000 | -13分 |\n| 北京邮大 | 576 | 13500 | -8分 |\n| 中南大学 | 571 | 14000 | -3分 |\n| 湖南大学 | 569 | 14800 | -1分 |\n\n⚠️ **注意**：以上数据为2024年参考数据，每年录取分数线会有±10分波动，请结合当年分数线分布谨慎填报。\n\n📌 **参考来源：** 2024年湖南省普通高校招生录取数据汇编',

  city:
    '城市选择对大学体验和就业影响深远，根据你的目标城市（武汉/长沙/成都）分析：\n\n**长沙（湖南本地优势）**\n✅ 本地生活成本低，家庭支持方便；中南大学、湖南大学都是优质选择\n\n**成都（西南科技重镇）**\n✅ 电子科技大学是成都核心985，互联网/通信企业集聚，生活节奏慢\n\n**西安（西北学术中心）**\n✅ 西安交大、西电是顶尖工科高校；生活成本较低，但就业市场规模不如一线\n\n**综合建议**：\n- 如果主要目标是**保研升学**，城市影响不大，学校质量优先\n- 如果主要目标是**就业**，北上广深或成都/武汉更有优势\n- 如果是**湖南本地生**，长沙高校性价比最高\n\n📌 **参考来源：** 2024年各城市互联网就业报告',

  major:
    '针对你的选科（物化生）和专业偏好（计算机/电子信息），以下是专业方向分析：\n\n**计算机科学与技术**\n🔥 就业竞争最激烈，但薪资天花板最高；保研主要方向为AI/系统方向；适合喜欢编程的同学\n\n**电子信息工程**\n⚡ 硬件+软件融合方向，就业面广；保研后可转向通信/芯片；适合动手能力强的同学\n\n**自动化**\n🤖 传统强势工科，就业于工业互联网/新能源汽车；保研偏向控制理论；适合喜欢系统设计的同学\n\n**结论**：三个方向都适合你的选科背景，建议优先考虑**电子信息类**——录取分数线通常略低于计算机，但就业和保研同样出色，属于高性价比选择。\n\n📌 **参考来源：** 2024年理工科专业就业蓝皮书',

  employment:
    '关于工科专业就业前景，2024年数据显示：\n\n**高薪方向排名（应届均薪）**\n1. 计算机/人工智能方向：18-25万/年\n2. 集成电路/芯片方向：16-22万/年\n3. 通信工程方向：14-20万/年\n4. 自动化/控制工程：12-18万/年\n\n**保研后薪资跃升**\n名校硕士（清北浙复交等）均薪普遍比本科高出40-60%，强烈建议重视保研赛道。\n\n**行业趋势**\n目前AI、新能源、半导体等领域需求旺盛；传统IT外包企业需求收缩；建议关注行业本质，选择有长期需求的方向。\n\n📌 **参考来源：** 2024届高校毕业生薪资白皮书',

  filling:
    '高考志愿填报的核心策略建议：\n\n**1. 冲稳保比例建议**\n- 冲刺志愿（2-3个）：位次在你之上1000-3000内的院校\n- 稳妥志愿（3-4个）：位次与你基本持平或略高\n- 保底志愿（2-3个）：位次在你之下3000以上的院校\n\n**2. 填报顺序原则**\n志愿顺序决定优先级，将最希望录取的学校排在前面。\n\n**3. 专业选择建议**\n在同等录取分数段内，选择就业强/保研率高的专业 > 选择"热门"但竞争激烈的专业\n\n**4. 避坑提醒**\n⚠️ 不要因为城市偏好而填偏远地区顶尖高校（除非真有意愿）\n⚠️ 关注各校的"不服从调剂"政策\n\n📌 **参考来源：** 各省招生考试院志愿填报指导手册',

  risk:
    '关于志愿填报风险评估，你的情况（568分，位次15000）分析如下：\n\n**高风险（需谨慎）**\n- 西安交通大学、电子科大：分差10-20分，滑档风险较高，建议每个方向只填1个\n\n**中等风险（合理冲刺）**\n- 北京邮电大学：分差约8分，位次差约1500，有一定可能性\n\n**低风险（推荐稳妥）**\n- 中南大学、湖南大学：往年录取线与你非常接近，是核心稳妥选项\n\n**确定录取**\n- 南京邮电大学、燕山大学：分数高出录取线10分以上，基本确定录取\n\n⚠️ **特别提示**：今年是"新高考"改革后的第X年，往年数据参考价值仍高，但建议密切关注省考试院发布的当年位次参考区间。\n\n📌 **参考来源：** 历年高考录取风险模型分析',

  default:
    '感谢你的提问！根据你的高考情况（568分，湖南，物化生），我为你整理了以下关键信息：\n\n你目前在推荐列表中共有10所院校可供选择，其中：\n- **冲刺院校** 3所（西安交大、电科大、北邮）\n- **稳妥院校** 4所（中南大学、湖南大学、华南理工、合肥工大）\n- **保底院校** 3所（南京邮大、燕山大学、长沙理工）\n\n**建议你重点关注：**\n1. 湖南大学和中南大学（本地优势+稳妥录取）\n2. 电子科技大学（如果想冲刺+保研两全）\n3. 南京邮电大学（保底但有行业优势）\n\n如果你有更具体的问题（保研率、专业方向、城市选择等），请告诉我，我来为你详细解答！\n\n📌 **参考来源：** AI院校匹配分析系统',
}

// ─── 知识库参考来源（RAG 检索结果）─────────────────────────
export const mockKnowledgeSources: KnowledgeSource[] = [
  {
    id: 'ks_001',
    type: '录取数据',
    year: 2024,
    title: '2024年湖南省普通高校招生录取数据汇编',
    source: '湖南省教育考试院',
    relevance: '湖南考生在各985/211院校的录取分数线、位次',
    excerpt: '西安交通大学：电气类588分，10000位；电子科技大学：电子信息类581分，12000位…',
  },
  {
    id: 'ks_002',
    type: '招生数据',
    year: 2024,
    schoolName: '西安交通大学',
    title: '西安交通大学2024年湖南省分专业招生计划',
    source: '西安交通大学本科招生网',
    relevance: '电气类、自动化类、计算机类在湖南的招生名额',
    excerpt: '电气类（含自动化）招生15人，含强基计划2人；钱学森实验班全国招生120人…',
  },
  {
    id: 'ks_003',
    type: '保研政策',
    year: 2024,
    schoolName: '电子科技大学',
    title: '电子科技大学2024年推免生工作实施细则',
    source: '电子科技大学教务处文件 [校发(2024)035号]',
    relevance: '英才实验班保研政策、综合排名计算方式',
    excerpt: '英才实验班学生综合排名前60%可直接获推免资格；普通班需排名前25%；竞赛获奖最高加3分…',
  },
  {
    id: 'ks_004',
    type: '保研政策',
    year: 2024,
    schoolName: '中南大学',
    title: '中南大学计算机学院保研推免实施办法',
    source: '中南大学计算机学院',
    relevance: '保研资格认定、与北航/中科院联合培养项目',
    excerpt: '本院推免比例约16%；与北京航空航天大学、中科院计算所设有联合培养计划共12个名额…',
  },
  {
    id: 'ks_005',
    type: '专业信息',
    schoolName: '湖南大学',
    title: '湖南大学电气与信息工程学院本科培养方案（2024版）',
    source: '湖南大学教务处',
    relevance: '电子信息工程专业课程设置、培养方向',
    excerpt: '主要方向：智能电网、电力电子、嵌入式系统；强基班保研率52%，需修满170学分…',
  },
  {
    id: 'ks_006',
    type: '培养方案',
    schoolName: '北京邮电大学',
    title: '北京邮电大学计算机类专业培养方案',
    source: '北京邮电大学计算机学院官网',
    relevance: '计算机科学与技术专业课程体系',
    excerpt: '前两年大类培养，第三学期分流；含AI/网安/软工三个方向；保研率约18%…',
  },
  {
    id: 'ks_007',
    type: '奖学金政策',
    schoolName: '电子科技大学',
    title: '电子科技大学本科生奖助学金管理办法',
    source: '电子科技大学学生处',
    relevance: '国奖、校级特等奖学金、企业冠名奖学金',
    excerpt: '国家奖学金8000元/年；校级特等10000元/年（前3%）；华为、中兴等企业奖学金最高20000元…',
  },
  {
    id: 'ks_008',
    type: '转专业政策',
    schoolName: '湖南大学',
    title: '湖南大学本科生转专业实施办法',
    source: '湖南大学教务处文件',
    relevance: '院内/跨院转专业申请条件',
    excerpt: '大一末可申请院内转专业；综合成绩前30%方可申请；热门专业（计算机/电子）竞争激烈…',
  },
]

// ─── 快捷提问列表 ──────────────────────────────────────────
export const mockQuickQuestions: string[] = [
  '我568分，想学计算机，哪个学校保研率最高？',
  '湖南大学和中南大学哪个更适合我？',
  '电子信息和计算机专业哪个更好就业？',
  '冲刺电子科技大学有多大把握？',
  '保研需要在大学期间做哪些准备？',
]

// ─── 初始聊天记录（欢迎消息）─────────────────────────────
export const initialChatMessages: ChatMessage[] = [
  {
    id: 'init_001',
    role: 'assistant',
    content:
      '你好！我是高考志愿填报 AI Agent 🎓\n\n我已经看到你的基本情况：**湖南省，568分，位次约15000，物化生选科，重视保研**。\n\n我会基于 **RAG 知识库**（含 8 类共 200+ 份招生/保研/培养方案数据）为你提供个性化建议。\n\n请直接提问，或点击下方快捷问题开始！',
    timestamp: Date.now() - 60000,
  },
]

// ─── Agent 场景判定 ───────────────────────────────────────
type Scenario = 'postgrad' | 'admission' | 'major' | 'risk' | 'city' | 'employment' | 'filling' | 'compare' | 'default'

function detectScenario(msg: string): Scenario {
  const m = msg.toLowerCase()
  if (m.includes('保研') || m.includes('推免')) return 'postgrad'
  if (m.includes('分数') || m.includes('录取') || m.includes('位次') || m.includes('分数线')) return 'admission'
  if (m.includes('风险') || m.includes('把握') || m.includes('概率') || m.includes('冲')) return 'risk'
  if (m.includes('对比') || m.includes('比较') || m.includes('和') || m.includes('vs')) return 'compare'
  if (m.includes('专业') || m.includes('计算机') || m.includes('电子') || m.includes('自动化')) return 'major'
  if (m.includes('城市') || m.includes('地方') || m.includes('哪里')) return 'city'
  if (m.includes('就业') || m.includes('薪资') || m.includes('工作')) return 'employment'
  if (m.includes('填报') || m.includes('志愿') || m.includes('技巧') || m.includes('怎么填')) return 'filling'
  return 'default'
}

// ─── 各场景的引用源（按 type 过滤）────────────────────────
function getSourcesForScenario(scenario: Scenario): KnowledgeSource[] {
  switch (scenario) {
    case 'postgrad':
      return mockKnowledgeSources.filter(s => s.type === '保研政策' || s.type === '培养方案').slice(0, 4)
    case 'admission':
    case 'risk':
      return mockKnowledgeSources.filter(s => s.type === '录取数据' || s.type === '招生数据').slice(0, 4)
    case 'major':
    case 'employment':
      return mockKnowledgeSources.filter(s => s.type === '专业信息' || s.type === '培养方案').slice(0, 4)
    case 'city':
      return mockKnowledgeSources.filter(s => ['录取数据', '招生数据', '专业信息'].includes(s.type)).slice(0, 3)
    case 'compare':
      return mockKnowledgeSources.filter(s => ['保研政策', '录取数据', '专业信息'].includes(s.type)).slice(0, 4)
    case 'filling':
      return mockKnowledgeSources.filter(s => ['录取数据', '招生数据', '院校官网'].includes(s.type)).slice(0, 3)
    default:
      return mockKnowledgeSources.slice(0, 3)
  }
}

// ─── 各场景的推荐院校 ────────────────────────────────────
function getRecommendationsForScenario(scenario: Scenario, _info: StudentInfo): SchoolRecommendation[] {
  switch (scenario) {
    case 'postgrad':
      // 按保研率（reason 中提取）排序，取前 4 个保研率最高的
      return [...mockRecommendations]
        .sort((a, b) => parseInt(b.postgradAdvantage.match(/(\d+)%/)?.[1] || '0') - parseInt(a.postgradAdvantage.match(/(\d+)%/)?.[1] || '0'))
        .slice(0, 4)
    case 'admission':
    case 'risk':
      // 冲稳保各取代表
      return [
        ...mockRecommendations.filter(r => r.category === '冲刺').slice(0, 2),
        ...mockRecommendations.filter(r => r.category === '稳妥').slice(0, 2),
        ...mockRecommendations.filter(r => r.category === '保底').slice(0, 1),
      ]
    case 'major':
      return mockRecommendations.filter(r =>
        r.recommendedMajor.includes('计算机') || r.recommendedMajor.includes('电子'),
      ).slice(0, 4)
    case 'city':
      return mockRecommendations.filter(r =>
        ['长沙', '武汉', '成都', '北京', '南京'].includes(r.city),
      ).slice(0, 4)
    case 'compare':
      return mockRecommendations.filter(r =>
        ['中南大学', '湖南大学', '电子科技大学', '西安交通大学'].includes(r.schoolName),
      ).slice(0, 4)
    case 'employment':
      return mockRecommendations.filter(r => r.category !== '冲刺').slice(0, 4)
    default:
      return mockRecommendations.slice(0, 3)
  }
}

// ─── 各场景的下一步建议 ──────────────────────────────────
function getNextActionsForScenario(scenario: Scenario): string[] {
  switch (scenario) {
    case 'postgrad':
      return ['查看电子科大保研政策详情', '对比 3 所高保研率院校', '生成保研规划报告']
    case 'admission':
    case 'risk':
      return ['查看完整推荐表', '加入对比清单', '调整风险偏好重新匹配']
    case 'major':
      return ['查看专业培养方案', '对比 3 个相关专业', '咨询专业转专业政策']
    case 'city':
      return ['查看长沙地区院校', '对比不同城市保研率', '了解就业地域优势']
    case 'compare':
      return ['进入横向对比页', '查看院校详情', '加入志愿对比表']
    case 'employment':
      return ['查看就业方向详情', '咨询行业薪资数据', '了解校企合作项目']
    case 'filling':
      return ['进入推荐结果页', '生成志愿规划报告', '查看冲稳保分配方案']
    default:
      return ['查看完整推荐列表', '咨询保研政策', '生成志愿规划报告']
  }
}

// ─── 各场景的回答文本 ────────────────────────────────────
function getAnswerForScenario(scenario: Scenario, info: StudentInfo): string {
  // 优先用 mockAIResponses 中已有的丰富文本
  switch (scenario) {
    case 'postgrad':   return mockAIResponses.postgrad
    case 'admission':  return mockAIResponses.admission
    case 'major':      return mockAIResponses.major
    case 'risk':       return mockAIResponses.risk
    case 'city':       return mockAIResponses.city
    case 'employment': return mockAIResponses.employment
    case 'filling':    return mockAIResponses.filling
    case 'compare':
      return `根据你的情况（${info.province} ${info.score}分），我帮你对比了几所适合的院校：\n\n**录取确定性**\n湖南大学 ✅ 稳妥 > 中南大学 ⚠️ 边缘 > 电子科大 ❗ 冲刺\n\n**保研竞争力**\n电子科大 25% > 西安交大 22% > 中南大学 16% > 湖南大学 15%\n\n**地域优势**\n湖南大学/中南大学：本省考生有政策倾斜，生活成本低\n电子科大：成都生活节奏舒适，电子产业聚集\n\n**综合建议**\n如果你**重视保研**（看你的画像确实如此），推荐：冲刺电子科大 + 稳妥中南/湖大组合。\n\n📌 **参考来源：** 各校招生办公室、推免实施细则`
    default:           return mockAIResponses.default
  }
}

// ─── 各场景的 Agent 执行步骤详情（生成动态 detail） ────────
function getStepDetails(scenario: Scenario, info: StudentInfo): Record<string, string> {
  const subjectStr = info.subjects.join('/')
  const cityStr = info.targetCities.length > 0 ? info.targetCities.join('/') : '不限'

  const common: Record<string, string> = {
    profile:  `识别画像：${info.province} ${info.score}分 位次${info.rank.toLocaleString()} | 选科${subjectStr} | 目标城市${cityStr}`,
    plan:     `已检索：8 所 985/211 院校在${info.province}的招生计划，覆盖${subjectStr}组合`,
    policy:   `已加载：${info.careAboutPostgrad ? '8' : '3'} 份保研政策文件（重点：电子科大、西安交大、中南）`,
    match:    `已运行匹配算法：基于位次差值 + 风险偏好(${info.riskPreference}) 筛出 4-5 所适配院校`,
    generate: `结合升学目标(${info.educationGoal ?? '保研'})生成个性化建议`,
  }

  // 不同场景下细节略有差异
  switch (scenario) {
    case 'postgrad':
      return {
        ...common,
        policy: '已加载：8 份保研政策文件 + 4 份学院推免细则（含强基/英才班数据）',
        match:  '已按保研率排序：电子科大(25%) > 西安交大(22%) > 中南(16%) > 湖大(15%)',
      }
    case 'admission':
    case 'risk':
      return {
        ...common,
        plan:  `已查询：2024 年${info.province}省 12 份招生计划，匹配位次区间 [${info.rank - 3000}, ${info.rank + 3000}]`,
        match: `已计算分差：与目标院校录取线分差 -22 ~ +20 分，覆盖冲刺/稳妥/保底`,
      }
    case 'major':
      return {
        ...common,
        plan:  `已检索：${info.majorPreference || '计算机/电子信息'}方向 6 份培养方案`,
        match: '已比对：3 个专业方向的就业去向、保研率、课程体系',
      }
    case 'compare':
      return {
        ...common,
        match: '已对比 4 所院校的 6 个核心指标（录取/保研/城市/就业/学科/特色班）',
      }
    default:
      return common
  }
}

// ─── 从历史中推断上次场景 ────────────────────────────────
function getLastScenarioFromHistory(history: ChatMessage[]): Scenario | null {
  // 找最近一条用户消息推断场景
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'user') {
      return detectScenario(history[i].content)
    }
  }
  return null
}

/**
 * 生成完整 Agent 响应（Mock 版本，上下文感知）
 *
 * 关键优化：根据历史对话决定哪些步骤可以"复用缓存"
 *   - 第 1 轮：跑全套 5 步
 *   - 同场景跟进：画像 + 招生 + 保研 都标 cached（秒过）
 *   - 跨场景提问：只画像 cached，其余正常跑
 *
 * ⚠️ 真实接入时替换此函数：
 * ```
 * export async function generateAgentResponse(message, info, history) {
 *   const res = await fetch('/api/agent/chat', {
 *     method: 'POST',
 *     body: JSON.stringify({ message, studentInfo: info, history })
 *   })
 *   return res.json() as AgentResponse
 * }
 * ```
 */
export function generateAgentResponse(
  message: string,
  info: StudentInfo,
  history: ChatMessage[] = [],
  mode: AgentMode = 'quick',
): AgentResponse {
  const scenario = detectScenario(message)
  const stepDetails = getStepDetails(scenario, info)
  const isDeep = mode === 'deep'

  // 判断是不是第 1 轮（仅有欢迎消息不算用户提问）
  const userTurns = history.filter(m => m.role === 'user').length
  const isFirstTurn = userTurns === 0

  // 判断是否与上轮同场景
  const lastScenario = getLastScenarioFromHistory(history)
  const isSameScenario = lastScenario !== null && lastScenario === scenario

  // 基础 5 步
  const baseSteps: AgentStep[] = [
    {
      id: 's1', icon: 'profile', status: 'pending',
      label: isFirstTurn ? '正在分析学生画像...' : '已加载学生画像',
      detail: isFirstTurn ? stepDetails.profile : `复用第 1 轮分析结果（${info.province} ${info.score}分）`,
      cached: !isFirstTurn,
    },
    {
      id: 's2', icon: 'plan', status: 'pending',
      label: isSameScenario ? '复用招生计划检索结果' : '正在检索招生计划...',
      detail: isSameScenario ? '上轮已检索同场景招生数据，直接复用' : stepDetails.plan,
      cached: isSameScenario,
    },
    {
      id: 's3', icon: 'policy', status: 'pending',
      label: isSameScenario ? '复用保研政策检索结果' : '正在查询保研政策...',
      detail: isSameScenario ? '上轮已加载相关政策文件，直接复用' : stepDetails.policy,
      cached: isSameScenario,
    },
    {
      id: 's4', icon: 'match', status: 'pending',
      label: '正在匹配院校专业...',
      detail: stepDetails.match,
      cached: false,
    },
    {
      id: 's5', icon: 'generate', status: 'pending',
      label: '正在生成升学建议...',
      detail: stepDetails.generate,
      cached: false,
    },
  ]

  // 深度模式：追加 2 个步骤
  const deepExtraSteps: AgentStep[] = isDeep ? [
    {
      id: 's6', icon: 'policy', status: 'pending',
      label: '正在交叉验证多个数据源...',
      detail: '比对 2024 招生数据、推免实施细则、培养方案、学科评估 4 类来源，剔除矛盾信息',
      cached: false,
    },
    {
      id: 's7', icon: 'generate', status: 'pending',
      label: '正在生成扩展分析...',
      detail: '基于交叉验证结果输出深度洞察、潜在风险与差异化策略',
      cached: false,
    },
  ] : []

  const agentSteps = [...baseSteps, ...deepExtraSteps]

  // 基础源
  const baseSources = getSourcesForScenario(scenario)
  // 深度模式：sources 数量翻倍（至少 5 个）
  const sources = isDeep
    ? [...baseSources, ...mockKnowledgeSources.filter(s => !baseSources.find(b => b.id === s.id))].slice(0, 5)
    : baseSources

  // 答案：深度模式末尾追加扩展段
  const baseAnswer = getAnswerForScenario(scenario, info)
  const deepSuffix = isDeep ? `

━━━━━━━━━━━━━━━━━━━━

🔬 **深度分析（多源交叉验证）**

**1. 数据可信度核查**
经过对比 ${baseSources.length + 2} 份原始文件（招生数据、推免细则、培养方案、学科评估），上述结论的核心数据相互印证，可信度高。

**2. 潜在风险提示**
- 政策每年微调（特别是保研比例），需关注 ${new Date().getFullYear() + 1} 年最新版细则
- 当年招生计划数变化可能导致录取位次浮动 ±1500 名

**3. 差异化策略建议**
基于你的画像（${info.province}/${info.score}分/${info.riskPreference}型），如果只能选一个核心策略，建议：**${info.careAboutPostgrad ? '优先冲击保研率突出且有特色班的院校' : '优先匹配地域+专业实力综合最优的稳妥方案'}**。`
    : ''

  return {
    answer: baseAnswer + deepSuffix,
    agentSteps,
    recommendations: getRecommendationsForScenario(scenario, info),
    sources,
    nextActions: getNextActionsForScenario(scenario),
  }
}
