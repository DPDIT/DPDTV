"use client";

import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className=" bg-white shadow-sm z-50">
      <div className="absolute top-4 right-4">
        <Link href={"/"}>
          <Image
            src="/logo/DPDTV_WHITE.png"
            alt="DPD TV Logo"
            width={200}
            height={200}
            className="object-contain"
          />
        </Link>
      </div>
    </header>
  );
}
