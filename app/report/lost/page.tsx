import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ItemForm from "@/components/ItemForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Report Lost Item",
};

export default function ReportLostPage() {
  return (
    <div className="max-w-2xl mx-auto py-6 sm:py-8 px-4">
      <Link
        href="/"
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Link>
      <h1 className="text-xl sm:text-2xl font-bold text-ua-blue">Report Lost Item</h1>
      <p className="text-gray-500 mt-1 mb-6 sm:mb-8 text-sm sm:text-base">
        Describe what you lost and we&apos;ll try to find a match.
      </p>
      <ItemForm type="lost" />
    </div>
  );
}
