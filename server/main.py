import httpx
import tempfile, os
from typing import Dict
from fastapi.responses import JSONResponse
from helper_functions import run_matrix_pipeline
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, File, UploadFile, Form, status
from contextlib import asynccontextmanager # Import asynccontextmanager for lifespan

# --- Configuration ---
# Dynamically get backend URL from environment variable, default to localhost for development
backend_url = os.getenv("BACKEND_URL", "http://localhost:4000") 

# --- IMPORTANT: Admin Authentication Token ---
# This token is required to access protected endpoints on your Node.js backend
# during FastAPI startup.
# In production, ensure ADMIN_AUTH_TOKEN is set as an environment variable.
# For local testing, you can temporarily hardcode a valid token obtained from a SUPER_ADMIN login.
ADMIN_AUTH_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjBkNWYwYmJmLWUyZWQtNDE1My04MzJlLWZjZjZlY2Q5ZDc0NiIsImVtYWlsIjoic2xhbnRpZWhhY2tzQGdtYWlsLmNvbSIsImlzU3VwZXIiOnRydWUsImlhdCI6MTc1MTY4NjQzNSwiZXhwIjoxNzUxNzcyODM1fQ.GaxnMcBsnThcKSwAbEe-r_CZ8lNyuu5YXQ93hDI4h80"


# Global variables to store fetched data
faculty_abbreviations = set()
subject_abbreviations = set()

async def fetch_faculty_abbreviations(token: str):
    """
    Fetches faculty abbreviations from the Node.js backend, including
    the Authorization header for authentication.
    """
    faculty_abbreviations_url = f"{backend_url}/api/v1/faculties/abbreviations/"
    headers = {"Authorization": f"Bearer {token}"} # Add Authorization header
    async with httpx.AsyncClient() as client:
        response = await client.get(faculty_abbreviations_url, headers=headers)
        response.raise_for_status() # This will raise an exception for 4xx/5xx responses
        data = response.json()
        # Ensure 'data' and 'abbreviations' keys exist in the response
        if "data" in data and "abbreviations" in data["data"]:
            return set(data["data"]["abbreviations"])
        else:
            raise ValueError("Unexpected response format for faculty abbreviations.")

async def fetch_subject_abbreviations(token: str):
    """
    Fetches subject abbreviations from the Node.js backend, including
    the Authorization header for authentication.
    """
    subject_abbreviations_url = f"{backend_url}/api/v1/subjects/abbreviations/"
    headers = {"Authorization": f"Bearer {token}"} # Add Authorization header
    async with httpx.AsyncClient() as client:
        response = await client.get(subject_abbreviations_url, headers=headers)
        response.raise_for_status() # This will raise an exception for 4xx/5xx responses
        data = response.json()
        # Ensure 'data' and 'abbreviations' keys exist in the response
        if "data" in data and "abbreviations" in data["data"]:
            return set(data["data"]["abbreviations"])
        else:
            raise ValueError("Unexpected response format for subject abbreviations.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles startup and shutdown events for the FastAPI application.
    Fetches necessary data on startup.
    """
    global faculty_abbreviations, subject_abbreviations
    print("🚀 FastAPI application starting up...")
    try:
        # Pass the ADMIN_AUTH_TOKEN to the fetch functions
        if ADMIN_AUTH_TOKEN == "YOUR_ACTUAL_SUPER_ADMIN_JWT_TOKEN_HERE":
            print("⚠️ WARNING: ADMIN_AUTH_TOKEN is still a placeholder. Please update it with a real token for proper authentication.")

        faculty_abbreviations = await fetch_faculty_abbreviations(ADMIN_AUTH_TOKEN)
        subject_abbreviations = await fetch_subject_abbreviations(ADMIN_AUTH_TOKEN)
        print("✅ Successfully fetched faculty and subject abbreviations on startup.")
    except httpx.HTTPStatusError as e:
        print(f"❌ HTTP Error during startup data fetch: {e}")
        print(f"Request URL: {e.request.url}")
        print(f"Response Status: {e.response.status_code}")
        print(f"Response Body: {e.response.text}")
        raise RuntimeError(f"Failed to fetch essential startup data: {e.response.text}") from e
    except Exception as e:
        print(f"❌ An unexpected error occurred during startup data fetch: {e}")
        raise RuntimeError(f"Failed to fetch essential startup data: {e}") from e
    yield
    # Clean up on shutdown if necessary
    print("👋 Application shutting down.")

# Initialize FastAPI app with the lifespan manager
app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)



# import httpx
# import tempfile, os
# from typing import Dict
# from fastapi.responses import JSONResponse
# from helper_functions import run_matrix_pipeline
# from fastapi.middleware.cors import CORSMiddleware
# from fastapi import FastAPI, File, UploadFile, Form, status

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# backend_url = "http://localhost:4000"
# # backend_url = "https://backend.reflectify.live" # Uncomment this line for production

# # fetch the faculty and subject abbreviations from the backend API
# async def fetch_faculty_abbreviations():
#     faculty_abbreviations_url = f"{backend_url}/api/v1/faculties/abbreviations/"
#     async with httpx.AsyncClient() as client:
#         response = await client.get(faculty_abbreviations_url)
#         response.raise_for_status()
#         data = response.json()
#         return set(data["data"]["abbreviations"])

# async def fetch_subject_abbreviations():
#     subject_abbreviations_url = f"{backend_url}/api/v1/subjects/abbreviations/"
#     async with httpx.AsyncClient() as client:
#         response = await client.get(subject_abbreviations_url)
#         response.raise_for_status()
#         data = response.json()
#         return set(data["data"]["abbreviations"])

# faculty_abbreviations = set()
# subject_abbreviations = set()

# @app.on_event("startup")
# async def startup_event():
#     global faculty_abbreviations, subject_abbreviations
#     faculty_abbreviations = await fetch_faculty_abbreviations()
#     subject_abbreviations = await fetch_subject_abbreviations()

# @app.get("/")
# async def root():
#     return {"message": "✅ FastAPI Server is running"}

# @app.post("/faculty-matrix", response_model=Dict, status_code=status.HTTP_200_OK)
# async def faculty_matrix(
#     facultyMatrix: UploadFile = File(...),
#     deptAbbreviation: str = Form(...)
# ):
#     try:
#         suffix = os.path.splitext(facultyMatrix.filename)[-1]
#         with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
#             content = await facultyMatrix.read()
#             temp_file.write(content)
#             temp_file_path = temp_file.name

#         results = run_matrix_pipeline(
#             matrix_file_path=temp_file_path,
#             faculty_abbreviations=faculty_abbreviations,
#             subject_abbreviations=subject_abbreviations,
#             department=deptAbbreviation,
#             college="LDRP-ITR"
#         )

#         if not results:
#             print("❌ No results found in the processed matrix")
#             return JSONResponse(status_code=404, content={"error": "No results found in the processed matrix"})

#         return JSONResponse(content=results)

#     except Exception as e:
#         print("❌ Processing error:", str(e))
#         return JSONResponse(status_code=500, content={"error": f"Processing error: {str(e)}"})

#     finally:
#         if os.path.exists(temp_file_path):
#             os.unlink(temp_file_path)
