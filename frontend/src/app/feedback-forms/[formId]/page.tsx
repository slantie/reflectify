"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { useRouter } from "next/navigation";
import {
  PencilIcon,
  EyeIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { FEEDBACK_FORMS } from "@/lib/apiEndPoints";

interface FeedbackForm {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  division: {
    divisionName: string;
  };
  subjectAllocation: {
    faculty: {
      name: string;
    };
    subject: {
      name: string;
    };
  };
}

export default function FeedbackFormTemplate() {
  const router = useRouter();
  const [forms, setForms] = useState<FeedbackForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await fetch(FEEDBACK_FORMS);
      const data = await response.json();
      if (data.success) {
        setForms(data.data);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch forms";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteForm = async (formId: string) => {
    if (!confirm("Are you sure you want to delete this form?")) return;

    try {
      const response = await fetch(
        `${FEEDBACK_FORMS}/${formId}`,
        { method: "DELETE" }
      );

      const data = await response.json();
      if (data.success) {
        toast.success("Form deleted successfully");
        fetchForms();
      } else {
        toast.error("Failed to delete form");
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : "Error deleting form";
      toast.error(errorMessage);
    }
  };

  const filteredAndSortedForms = forms
    .filter((form) => {
      const matchesSearch =
        form.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        form.division.divisionName
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        form.subjectAllocation.faculty.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" ||
        form.status.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header Section */}
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                Feedback Forms
              </h1>
              <p className="mt-2 text-lg text-gray-600">
                Manage and monitor student feedback forms
              </p>
            </div>
            <button
              onClick={() => router.push("/feedback-forms/new")}
              className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 
                       transition-colors flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Create New Form
            </button>
          </div>

          {/* Filters Section */}
          <div className="bg-white p-6 rounded-xl shadow-sm space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  id="search-forms"
                  name="search-forms"
                  placeholder="Search by title, division, or faculty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 
                           focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <select
                id="status-filter"
                name="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 
                         focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
              <select
                id="sort-by"
                name="sort-by"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 
                         focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Forms Grid */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAndSortedForms.map((form) => (
              <Card
                key={form.id}
                className="bg-white overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {form.title}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Division: {form.division.divisionName}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full
                        ${
                          form.status === "PUBLISHED"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                    >
                      {form.status}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Faculty: {form.subjectAllocation.faculty.name}</p>
                    <p>Subject: {form.subjectAllocation.subject.name}</p>
                    <p className="text-gray-500">
                      Created: {new Date(form.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() =>
                        router.push(`/feedback-forms/edit/${form.id}`)
                      }
                      className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                      title="Edit Form"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() =>
                        router.push(`/feedback-forms/preview/${form.id}`)
                      }
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Preview Form"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteForm(form.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Form"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredAndSortedForms.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl">
              <p className="text-gray-500 text-lg">
                No forms found matching your criteria
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
