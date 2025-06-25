import { Head } from "@inertiajs/react";
import React from "react";
interface Props {
    children: React.ReactNode;
}
export default function HomeLayout({ children }: Props) {
    return (
        <>
            <Head>
                <title>WA GATEWAY</title>
                <meta
                    head-key="description"
                    name="description"
                    content="WA GATEWAY"
                />
                <link rel="icon" type="image/svg+xml" href={"/images/wa.svg"} />
            </Head>
            <div className="overflow-x-hidden">{children}</div>
        </>
    );
}
