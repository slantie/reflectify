"use client";

import { useState, useEffect, use } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import { FEEDBACK_FORMS } from "@/lib/apiEndPoints";

interface Question {
  id: string;
  categoryId: string;
  text: string;
  type: string;
  isRequired: boolean;
  displayOrder: number;
}

interface FeedbackForm {
  id: string;
  title: string;
  status: string;
  questions: Question[];
  division: {
    divisionName: string;
  };
}

export default function PreviewFeedbackForm({
  params,
}: {
  params: Promise<{ formId: string }>;
}) {
  const router = useRouter();
  const formId = use(params).formId;
  const [form, setForm] = useState<FeedbackForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const batches = ["all", "1", "2", "3"];

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const response = await fetch(
          `${FEEDBACK_FORMS}/${formId}`
        );
        const data = await response.json();
        if (data.success) {
          setForm(data.data);
        } else {
          toast.error("Failed to load form");
        }
      } catch (error) {
        console.error("Error loading form:", error);
        toast.error("Error loading form");
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId]);

  const getBatchDisplayName = (batch: string) => {
    if (batch === "all") return "All Questions";
    return `Batch ${batch} Questions`;
  };

  const getQuestionText = (text: string) => {
    return text.split("-")[0].trim();
  };

  const getQuestionBatch = (text: string) => {
    return text.split("-")[1]?.trim() || "-";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Form not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white py-16">
      <div className="max-w-8xl mx-auto px-8">
        {/* Header Section */}
        <div className="mb-16">
          <div className="flex justify-between items-start">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-gray-900">{form.title}</h1>
              <div className="flex items-center gap-3 text-gray-600">
                <UserGroupIcon className="h-6 w-6" />
                <span className="text-xl">{form.division.divisionName}</span>
              </div>
            </div>
            <button
              onClick={() => router.back()}
              className="px-8 py-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all
                       text-gray-700 hover:text-gray-900 font-medium"
            >
              Return to Dashboard
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-10 gap-8">
          {/* Sidebar */}
          <div className="col-span-2">
            <div className="sticky top-8 space-y-6 bg-white p-6 rounded-2xl shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900">
                Filter Questions
              </h2>
              <div className="space-y-3">
                {batches.map((batch) => (
                  <button
                    key={batch}
                    onClick={() => setSelectedBatch(batch)}
                    className={`w-full px-4 py-3 rounded-xl text-left transition-all
                      ${
                        selectedBatch === batch
                          ? "bg-orange-500 text-white font-medium"
                          : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                      }`}
                  >
                    {getBatchDisplayName(batch)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Questions Content */}
          <div className="col-span-8 space-y-8">
            {/* Theory Questions Section */}
            {form.questions.filter((q) => getQuestionBatch(q.text) === "None")
              .length > 0 && (
              <section className="bg-white rounded-2xl shadow-sm p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-8">
                  Theory Questions
                </h2>
                <div className="space-y-8">
                  {form.questions
                    .filter((q) => getQuestionBatch(q.text) === "None")
                    .map((question, index) => (
                      <div
                        key={question.id}
                        className="border-b border-gray-100 last:border-0 pb-8 last:pb-0"
                      >
                        <h3 className="text-xl font-medium text-gray-800">
                          {index + 1}. {getQuestionText(question.text)}
                          {question.isRequired && (
                            <span className="text-red-500 ml-2">*</span>
                          )}
                        </h3>
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* Batch Questions Sections */}
            {["1", "2", "3"].map((batchNum) => {
              const batchQuestions = form.questions.filter(
                (q) => getQuestionBatch(q.text) === batchNum
              );
              if (
                batchQuestions.length === 0 ||
                (selectedBatch !== "all" && selectedBatch !== batchNum)
              )
                return null;

              return (
                <section
                  key={batchNum}
                  className="bg-white rounded-2xl shadow-sm p-8"
                >
                  <h2 className="text-2xl font-bold text-gray-900 mb-8">
                    Batch {batchNum} Questions
                  </h2>
                  <div className="space-y-8">
                    {batchQuestions.map((question, index) => (
                      <div
                        key={question.id}
                        className="border-b border-gray-100 last:border-0 pb-8 last:pb-0"
                      >
                        <h3 className="text-xl font-medium text-gray-800">
                          {index + 1}. {getQuestionText(question.text)}
                          {question.isRequired && (
                            <span className="text-red-500 ml-2">*</span>
                          )}
                        </h3>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
