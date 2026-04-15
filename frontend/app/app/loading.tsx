import Image from "next/image";
import { PUB } from "@/utils/assetPaths";

export default function AppLoading() {
    return (
        <div className="flex min-h-[56vh] w-full items-center justify-center bg-[#d8d8d8]">
            <div className="flex flex-col items-center gap-4">
                <div className="gather-loader-logo shadow-[0_6px_20px_rgba(0,0,0,0.22)]">
                    <Image
                        src={`${PUB.ui}/gather-logo.png`}
                        alt="Gathering logo"
                        width={32}
                        height={32}
                        priority
                    />
                </div>

                <div className="h-[8px] w-[126px] rounded-full bg-[#565656] p-[1px]">
                    <div className="gather-loader-bar h-full rounded-full bg-[#1f1f1f]" />
                </div>

                <p className="text-[13px] font-medium tracking-[0.01em] text-[#5c5c5c]">
                    Connecting to room...
                </p>
            </div>
        </div>
    );
}
