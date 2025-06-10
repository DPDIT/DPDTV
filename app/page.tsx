import Link from "next/link";
import Header from "@/app/components/Header";

export default function Home() {
  return (
    <>
      <Header />
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative mx-auto pt-24">
        <div className="flex flex-col items-center space-y-6 w-full max-w-md">
          <Link
            href="/internal"
            className="w-full px-8 py-4 bg-[#FFFFFF] text-[#006747] rounded-lg hover:bg-[#8B5B29] hover:text-[#FFFFFF] transition-colors text-xl text-center"
          >
            View Internal Images
          </Link>
          <Link
            href="/public"
            className="w-full px-8 py-4 bg-[#FFFFFF] text-[#006747] rounded-lg hover:bg-[#8B5B29] hover:text-[#FFFFFF] transition-colors text-xl text-center"
          >
            View Public Images{""}
          </Link>
        </div>
      </div>
    </>
  );
}
