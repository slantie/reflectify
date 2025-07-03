"use client";

import {
  FEEDBACK_FORM_ACCESS,
  FEEDBACK_FORM_CHECK_SUBMISSION,
  FEEDBACK_FORM_SUBMIT,
} from "@/lib/apiEndPoints";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

interface Question {
  id: string;
  text: string;
  type: string;
  batch: string;
  isRequired: boolean;
  displayOrder: number;
  faculty: {
    name: string;
  };
  subject: {
    name: string;
  };
}

interface FeedbackForm {
  id: string;
  title: string;
  questions: Question[];
}

type ResponseValue = number | string;

const SuccessModal = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4 transform transition-all">
      <div className="mb-6">
        <svg
          className="mx-auto h-16 w-16 text-orange-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-center text-gray-800 mb-4">
        Feedback Submitted Successfully!
      </h3>
      <p className="text-center text-gray-600 mb-6">
        Thank you for your valuable feedback.
      </p>
    </div>
  </div>
);

export default function FeedbackForm() {
  const params = useParams();
  const [form, setForm] = useState<FeedbackForm | null>(null);
  const [responses, setResponses] = useState<Record<string, ResponseValue>>({});
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fetchForm = useCallback(async () => {
    try {
      const response = await fetch(`${FEEDBACK_FORM_ACCESS}/${params.token}`);
      const data = await response.json();

      if (data.success) {
        const submissionCheck = await fetch(
          `${FEEDBACK_FORM_CHECK_SUBMISSION}/${params.token}`
        );
        const submissionData = await submissionCheck.json();

        if (submissionData.isSubmitted) {
          setIsSubmitted(true);
        } else {
          setForm(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching form:", error);
    } finally {
      setLoading(false);
    }
  }, [params.token]);

  const handleResponseChange = (questionId: string, value: ResponseValue) => {
    setResponses((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${FEEDBACK_FORM_SUBMIT}/${params.token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(responses),
      });

      const data = await response.json();

      if (data.success) {
        setShowSuccessModal(true);
        setIsSubmitted(true);
        setTimeout(() => {
          window.location.href = "/feedback/thank-you";
        }, 2000);
      } else {
        alert(data.message || "Failed to submit feedback");
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Error submitting feedback. Please try again.");
    }
  };

  const generalQuestions = form?.questions
    .filter((question) => question.batch === "None")
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const batchQuestions = form?.questions
    .filter((question) => question.batch === selectedBatch)
    .sort((a, b) => a.displayOrder - b.displayOrder);

  useEffect(() => {
    fetchForm();
    // Since fetchForm is defined inside the component, we need to include it in dependencies
  }, [params.token, fetchForm]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">
          {isSubmitted
            ? "You have already submitted this feedback. Thank you!"
            : `Form not found ${isSubmitted}`}
        </div>
      </div>
    );
  }

  if (!selectedBatch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Select Your Batch
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((batch) => (
              <button
                key={batch}
                onClick={() => setSelectedBatch(batch.toString())}
                className="p-4 bg-orange-50 rounded-lg text-lg font-semibold text-orange-600 
                hover:bg-orange-100 transition-all transform hover:scale-105"
              >
                Batch {batch}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderQuestionResponse = (question: Question) => {
    switch (question.type.toUpperCase()) {
      case "RATING":
        return (
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex justify-between mb-2 text-sm text-gray-600">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
            <div className="grid grid-cols-10 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => (
                <label
                  key={value}
                  className={`
                    relative flex flex-col items-center p-2 rounded-lg cursor-pointer
                    transition-all hover:bg-orange-50
                    ${
                      responses[question.id] === value
                        ? "bg-orange-100"
                        : "bg-white"
                    }
                  `}
                >
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={value}
                    checked={responses[question.id] === value}
                    onChange={() => handleResponseChange(question.id, value)}
                    className="sr-only"
                    required={question.isRequired}
                  />
                  <span
                    className={`
                      text-lg font-semibold mb-1
                      ${
                        responses[question.id] === value
                          ? "text-orange-500"
                          : "text-gray-700"
                      }
                    `}
                  >
                    {value}
                  </span>
                </label>
              ))}
            </div>
          </div>
        );

      case "TEXT":
        return (
          <div className="mt-4">
            <textarea
              className="w-full p-4 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              rows={4}
              placeholder="Enter your response here..."
              value={(responses[question.id] as string) || ""}
              onChange={(e) =>
                handleResponseChange(question.id, e.target.value)
              }
              required={question.isRequired}
            />
          </div>
        );

      default:
        return null;
    }
  };

  const renderQuestionSection = (questions: Question[], startIndex: number) => {
    return questions.map((question, index) => (
      <div
        key={question.id}
        className="bg-white rounded-xl shadow-lg p-8 transform transition-all hover:shadow-xl"
      >
        <div className="flex items-start mb-6">
          <span className="text-2xl font-bold text-orange-500 mr-4">
            {(startIndex + index + 1).toString().padStart(2, "0")}
          </span>
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {question.text}
              {question.isRequired && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </h2>
            <div className="text-sm text-gray-600">
              <span>{question.faculty.name}</span>
              <span className="mx-2">•</span>
              <span>{question.subject.name}</span>
              {question.batch !== "None" && (
                <>
                  <span className="mx-2">•</span>
                  <span>Batch {question.batch}</span>
                </>
              )}
            </div>
          </div>
        </div>
        {renderQuestionResponse(question)}
      </div>
    ));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-50">
      {showSuccessModal && <SuccessModal />}
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-4">
          <h1 className="text-3xl font-bold text-center text-gray-800 mb-2">
            {form.title}
          </h1>
          <p className="text-center text-gray-600 mb-2">
            Your feedback helps us improve the quality of education
          </p>
          <div className="flex justify-center space-x-4 text-md text-gray-500">
            <span>All responses are anonymous</span>
            <span>•</span>
            <span>Required fields are marked with *</span>
            <span>•</span>
            <span className="font-semibold">Batch {selectedBatch}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {generalQuestions && generalQuestions.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-2">
                Lecture Feedback
              </h2>
              {renderQuestionSection(generalQuestions, 0)}
            </div>
          )}

          {batchQuestions && batchQuestions.length > 0 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mt-8">
                Lab Feedback
              </h2>
              {renderQuestionSection(
                batchQuestions,
                generalQuestions?.length || 0
              )}
            </div>
          )}

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="
                px-8 py-4 bg-orange-500 text-white rounded-xl font-semibold
                transform transition-all hover:bg-orange-600 hover:scale-105
                focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
              "
            >
              Submit Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
