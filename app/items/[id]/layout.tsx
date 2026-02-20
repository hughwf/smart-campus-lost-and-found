import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Item Details",
};

export default function ItemDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
