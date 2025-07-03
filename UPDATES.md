# Reflectify Updates

## Backend

1. Dynamic Faculty Matrix Extraction Logic. -- Done!

2. Fix the logic where uploading a new excel file overwrites the DB with new entries.(Identify the new rows/data and update only the required portion) -- Done!

3. Batch (2022-26) Additions to the whole DB. -- Done! (Need to change a lot of functions with minute details)

4. Manage data for all the batches from the very start. Persistent system with continuous data addition. -- Done! (Need to make endpoints to fetch data properly the data stats in the database while being persistent)

5. Endpoint to export faculty performance data Format [Faculty Name] [Semester 1] ... [Semester 8] [Overall].

6. Lab Scores are not required as a priority, Lecture Scores are the most important ones.

7. Create a /promotion endpoint to ensure students (AcademicYear field) are promoted to the next semester after completion of each academic year. (ensure it is prisma transaction and is only performed once per academic year)

## Frontend

1. Semester CRUD Page.

2. Dropdowns wherever possible/applicable.

3. Fix the responses badge on the Landing Page.

4. Add the excel data templates to the Upload Data Page for each card.

5. Add Batch selection when uploading the Faculty Matrix.

6. Add student's email data upload field for the particular feedback form to target the students. Check if Google Groups can be utilized for the same.

7. The design should be end to end responsive.
