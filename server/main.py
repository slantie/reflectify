import httpx
import tempfile, os
from typing import Dict
from fastapi.responses import JSONResponse
from helper_functions import run_matrix_pipeline
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, File, UploadFile, Form, status

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

backend_url = "http://localhost:4000"
# backend_url = "https://backend.reflectify.live" # Uncomment this line for production

# fetch the faculty and subject abbreviations from the backend API
async def fetch_faculty_abbreviations():
    faculty_abbreviations_url = f"{backend_url}/api/faculty/abbreviations/all"
    async with httpx.AsyncClient() as client:
        response = await client.get(faculty_abbreviations_url)
        response.raise_for_status()
        data = response.json()
        return set(data)
    
async def fetch_subject_abbreviations():
    subject_abbreviations_url = f"{backend_url}/api/subject/abbreviations/all"
    async with httpx.AsyncClient() as client:
        response = await client.get(subject_abbreviations_url)
        response.raise_for_status()
        data = response.json()
        return set(data)

faculty_abbreviations = set()
subject_abbreviations = set()

@app.on_event("startup")
async def startup_event():
    global faculty_abbreviations, subject_abbreviations
    faculty_abbreviations = await fetch_faculty_abbreviations()
    subject_abbreviations = await fetch_subject_abbreviations()

@app.get("/")
async def root():
    return {"message": "✅ FastAPI Server is running"}

@app.post("/faculty-matrix", response_model=Dict, status_code=status.HTTP_200_OK)
async def faculty_matrix(
    facultyMatrix: UploadFile = File(...),
    deptAbbreviation: str = Form(...)
):
    try:
        suffix = os.path.splitext(facultyMatrix.filename)[-1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            content = await facultyMatrix.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        results = run_matrix_pipeline(
            matrix_file_path=temp_file_path,
            faculty_abbreviations=faculty_abbreviations,
            subject_abbreviations=subject_abbreviations,
            department=deptAbbreviation,
            college="LDRP-ITR"
        )

        if not results:
            print("❌ No results found in the processed matrix")
            return JSONResponse(status_code=404, content={"error": "No results found in the processed matrix"})

        return JSONResponse(content=results)

    except Exception as e:
        print("❌ Processing error:", str(e))
        return JSONResponse(status_code=500, content={"error": f"Processing error: {str(e)}"})

    finally:
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
