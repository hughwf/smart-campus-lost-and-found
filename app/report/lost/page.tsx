import Link from "next/link";
import ItemForm from "@/components/ItemForm";

export default function ReportLostPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link
        href="/"
        className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-block"
      >
        &larr; Back
      </Link>
      <h1 className="text-2xl font-bold">Report Lost Item</h1>
      <p className="text-gray-500 mt-1 mb-8">
        Describe what you lost and we&apos;ll try to find a match.
      </p>
      <ItemForm type="lost" />
    </div>
  );
}
