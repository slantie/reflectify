export const NODE_ENV = process.env.NODE_ENV || "production";
export const BACKEND_DEV_URL = "http://localhost:4000";
export const BACKEND_PROD_URL = "https://backend.reflectify.live";

export const BASE_URL =
    NODE_ENV === "development" ? BACKEND_DEV_URL : BACKEND_PROD_URL;
export const API_URL = `${BASE_URL}/api`;

// Auth endpoints
export const AUTH_ENDPOINTS = {
    LOGIN: `${API_URL}/auth/login`,
    REGISTER: `${API_URL}/auth/register`,
    SUPER_REGISTER: `${API_URL}/auth/super/register`,
    ME: `${API_URL}/auth/me`,
    UPDATE_PASSWORD: `${API_URL}/auth/updatepassword`,
    UPDATE_SUPER_PASSWORD: `${API_URL}/auth/updatesuperpassword`,
};

// Analytics endpoints
export const GET_ALL_SEMDIVS = `${API_URL}/analytics/getall-semdiv`;
export const SUBJECT_RATING = `${API_URL}/analytics/grouped-barchart?semesterId=`;
export const GET_ALL_FACULTIES = `${API_URL}/faculty-analytics/get-faculties`;
export const RADAR_CHART = `${API_URL}/faculty-analytics/radar-chart`;
export const GROUPED_BAR_CHART = `${API_URL}/faculty-analytics/grouped-bar-chart`;
export const LINE_CHART = `${API_URL}/faculty-analytics/line-chart`;
export const GET_SUBJECTS = `${API_URL}/faculty-analytics/get-subjects`;
export const SUBJECT_WISE = `${API_URL}/faculty-analytics/subject-wise`;
export const GET_FACULTY_PERFORMANCE_YEAR = `${API_URL}/faculty-analytics/get-faculty-performance-year`;
export const GET_ALL_FACULTY_PERFORMANCE_FOR_YEAR = `${API_URL}/faculty-analytics/get-all-faculty-performance`;

// Faculty-matrix endpoints
export const FACULTY_MATRIX_DEPARTMENTS = `${API_URL}/departments`;
export const API_ACADEMIC_YEARS = `${API_URL}/academic-years`;
export const FACULTY_MATRIX_UPLOAD = `${API_URL}/upload/faculty-matrix`;

// Dashboard endpoints
export const DASHBOARD_DIVISION = `${API_URL}/divisions`;
export const DASHBOARD_SUBJECT = `${API_URL}/subject`;
export const DASHBOARD_SEMESTER = `${API_URL}/semester`;
export const DASHBOARD_FACULTY = `${API_URL}/faculty`;

export const DASHBOARD_STATS = `${API_URL}/dashboard/stats`;
export const DASHBOARD_DEPARTMENT = `${API_URL}/dashboard/department`;
export const DASHBOARD_DEPARTMENTS = `${API_URL}/dashboard/departments`;
export const DASHBOARD_FACULTY_CREATE = `${API_URL}/dashboard/createfaculty`;
export const DASHBOARD_STUDENTS = `${API_URL}/dashboard/student`;

export const DASHBOARD_DIVISIONS_CREATE = `${API_URL}/divisions/create`;
export const SUBJECT_SEMESTER = `${API_URL}/subject/semester`;
export const QUESTION_CATEGORIES = `${API_URL}/question-categories`;
export const GET_TOTAL_RESPONSES = `${API_URL}/analytics/total-responses`;

// Upload endpoints
export const UPLOAD_FACULTY = `${API_URL}/upload/faculty-data`;
export const UPLOAD_STUDENT = `${API_URL}/upload/student-data`;
export const UPLOAD_SUBJECT = `${API_URL}/upload/subject-data`;

// Feedback endpoints
export const FEEDBACK_FORM_ACCESS = `${API_URL}/feedback/forms/access`;
export const FEEDBACK_FORM_CHECK_SUBMISSION = `${API_URL}/response/check-submission`;
export const FEEDBACK_FORM_SUBMIT = `${API_URL}/response/submit`;
export const FEEDBACK_FORMS = `${API_URL}/feedback/forms`;
export const FEEDBACK_FORM_ACADEMIC_STRUCTURE = `${API_URL}/selection/academic-structure`;
export const FEEDBACK_FORM_GENERATE = `${API_URL}/feedback/generate`;
export const FEEDBACK_QUESTIONS_FORMS = `${API_URL}/questions/forms`;
