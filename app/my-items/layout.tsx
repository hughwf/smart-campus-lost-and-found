import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Items",
};

export default function MyItemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
