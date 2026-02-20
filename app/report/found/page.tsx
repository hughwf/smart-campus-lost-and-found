import Link from "next/link";
import ItemForm from "@/components/ItemForm";

export default function ReportFoundPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link
        href="/"
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
      >
        &larr; Back
      </Link>
      <h1 className="text-2xl font-bold">Report Found Item</h1>
      <p className="text-gray-500 mt-1 mb-8">
        Help reunite someone with their lost item. Upload a photo and
        we&apos;ll use AI to match it.
      </p>
      <ItemForm type="found" />
    </div>
  );
}
