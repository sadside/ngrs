"use client";

import { TrendingUp } from "lucide-react";
import { Bar, BarChart, XAxis, Cell } from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/shared/ui/card";

import React from "react";
import {ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent} from "../../../@/shared/ui/chart";

const chartConfig = {
    desktop: {
        label: "Desktop",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig;

export function TripsPerWeek({chartData}: {chartData: Array<any>}) {
    const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

    const activeData = React.useMemo(() => {
        if (activeIndex === null) return null;
        return chartData[activeIndex];
    }, [activeIndex]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Рейсы за неделю
                </CardTitle>
                {/*<CardDescription>*/}
                {/*    описание виджета*/}
                {/*</CardDescription>*/}
            </CardHeader>
            <CardContent>
                <ChartContainer config={chartConfig}>
                    <BarChart
                        accessibilityLayer
                        data={chartData}
                        onMouseLeave={() => setActiveIndex(null)}
                    >
                        <rect
                            x="0"
                            y="0"
                            width="100%"
                            height="85%"
                            fill="url(#highlighted-pattern-dots)"
                        />
                        <defs>
                            <DottedBackgroundPattern />
                        </defs>
                        <XAxis
                            dataKey="day"
                            tickLine={false}
                            tickMargin={10}
                            axisLine={false}
                            tickFormatter={(value) => value.slice(0, 3)}
                        />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Bar dataKey="trips" radius={6} fill="var(--color-primary)">
                            {chartData.map((_, index) => (
                                <Cell
                                    className="duration-200"
                                    key={`cell-${index}`}
                                    fillOpacity={
                                        activeIndex === null ? 1 : activeIndex === index ? 1 : 0.3
                                    }
                                    stroke={activeIndex === index ? "var(--color-primary)" : ""}
                                    onMouseEnter={() => setActiveIndex(index)}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}

const DottedBackgroundPattern = () => {
    return (
        <pattern
            id="highlighted-pattern-dots"
            x="0"
            y="0"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
        >
            <circle
                className="dark:text-muted/40 text-muted"
                cx="2"
                cy="2"
                r="1"
                fill="currentColor"
            />
        </pattern>
    );
};
