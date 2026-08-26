export const referenceFiles = {
  facultyMatrix:
    process.env.NEXT_PUBLIC_FACULTY_MATRIX_REFERENCE_FILE_URL ??
    "https://docs.google.com/spreadsheets/d/1yp61h5vitWgAw_BYieZLtE-Sp52tK8Rr/edit?usp=sharing&ouid=105338775516938942439&rtpof=true&sd=true",
  facultyData:
    process.env.NEXT_PUBLIC_FACULTY_DATA_REFERENCE_FILE_URL ??
    "https://docs.google.com/spreadsheets/d/1sZ9r6jbZQTytChQUgur3wJXWp254eOts/edit?usp=sharing&ouid=105338775516938942439&rtpof=true&sd=true",
  subjectData:
    process.env.NEXT_PUBLIC_SUBJECT_DATA_REFERENCE_FILE_URL ??
    "https://docs.google.com/spreadsheets/d/1yeZx1qBArpu0feg-xyXTDmsbOmC04Yvv/edit?usp=sharing&ouid=105338775516938942439&rtpof=true&sd=true",
  studentData:
    process.env.NEXT_PUBLIC_STUDENT_DATA_REFERENCE_FILE_URL ??
    "https://docs.google.com/spreadsheets/d/19scpTIj9cbXEM_2FHArGdeGFFBD2a78u/edit?usp=sharing&ouid=105338775516938942439&rtpof=true&sd=true",
} as const
