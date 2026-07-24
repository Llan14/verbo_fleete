import { ContextData } from "@/components/ContextForm";

export type ExerciseModule = "reading" | "grammar" | "speaking" | "writing" | "listening";

export interface ExerciseDraftRequest extends ContextData {
  module: ExerciseModule;
}

export interface ExerciseDraftResponse {
  draft_id: number;
  module: ExerciseModule;
  payload: Record<string, unknown>;
  generated_at: string;
  version: string;
}

export interface TeacherAssignmentCreateRequest {
  title: string;
  instructions?: string;
  group_id: number;
  due_at: string;
  weight: number;
  draft_id?: number;
}

export interface TeacherAssignmentCreateResponse {
  assignment_id: number;
  recipients_count: number;
  created_at: string;
}

export interface TeacherAssignmentDeleteResponse {
  assignment_id: number;
  recipients_deleted: number;
  message: string;
}

export interface TeacherAssignmentListItem {
  assignment_id: number;
  title: string;
  module: string;
  group_id: number;
  group_name: string;
  due_at: string;
  weight: number;
  recipients_count: number;
  submitted_count: number;
}

export interface TeacherAssignmentRecipientResult {
  recipient_id: number;
  student_id: number;
  student_name: string;
  student_email: string;
  status: string;
  submitted_at: string | null;
  score: number | null;
}

export interface TeacherAssignmentResultsResponse {
  assignment_id: number;
  title: string;
  module: string;
  group_name: string;
  due_at: string;
  weight: number;
  submitted_count: number;
  recipients_count: number;
  average_score: number | null;
  recipients: TeacherAssignmentRecipientResult[];
}

export interface TeacherGradeDeliveryItem {
  alumno_id: number;
  alumno_nombre: string;
  calificacion: number | null;
  errores_frecuentes: string | null;
}

export interface TeacherGradesByGroupItem {
  tarea_id: number;
  titulo: string;
  group_id: number;
  entregas: TeacherGradeDeliveryItem[];
}

export interface StudentAssignmentListItem {
  assignment_id: number;
  recipient_id: number;
  title: string;
  module: string;
  group_name: string;
  due_at: string;
  weight: number;
  status: string;
  submitted_at: string | null;
  score: number | null;
}

export interface StudentAssignmentDetail {
  assignment_id: number;
  recipient_id: number;
  title: string;
  instructions: string | null;
  module: string;
  group_name: string;
  due_at: string;
  weight: number;
  status: string;
  payload: Record<string, unknown>;
}

export interface SubmitAssignmentRequest {
  answers_payload: Record<string, unknown>;
  score?: number;
}

export interface SubmitAssignmentResponse {
  submission_id: number;
  submitted_at: string;
  status: string;
  score: number | null;
}

export interface PracticeSessionCreateRequest {
  module: string;
  draft_id?: number;
  answers_payload?: Record<string, unknown>;
  score?: number;
}

export interface PracticeSessionCreateResponse {
  practice_session_id: number;
  created_at: string;
}

export interface TutorGroup {
  id: number;
  nombre: string;
}
