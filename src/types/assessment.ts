export type StudentClass = '10' | '11-science' | '12-science';
export type BoardType = 'CBSE' | 'GSEB';

export interface StudentProfile {
  name: string;
  studentClass: StudentClass;
  board: BoardType;
  phone?: string;
  registeredAt?: string;
}

export interface Chapter {
  id: string;
  chapterNumber: number;
  title: string;
  classId: StudentClass;
  unit: string;
  keyTopics: string[];
  difficulty: 'Foundational' | 'Moderate' | 'Advanced';
  estimatedMinutes: number;
  diagnosticQuestionsCount: number;
  isDemonstration: boolean;
  conceptHighlight: string;
}

export interface SampleQuestion {
  id: string;
  chapterTitle: string;
  classLabel: string;
  questionText: string;
  conceptTested: string;
  options: { label: string; text: string }[];
  correctOption: string;
  hemangSirNote: string;
}
