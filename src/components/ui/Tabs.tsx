"use client"

import React, { useState } from "react"

interface TabsProps {
    children: React.ReactNode
    defaultValue: string
}

export function Tabs({ children, defaultValue }: TabsProps) {
    const [active, setActive] = useState(defaultValue);

    const childrenArray = React.Children.toArray(children);
    const list = childrenArray.find((c: any) => c.type === TabsList);
    const contents = childrenArray.filter((c: any) => c.type === TabsContent);

    return (
        <div className="w-full h-full flex flex-col">
            <div className="flex border-b mb-4 shrink-0 overflow-x-auto">
                {(list as any)?.props.children.map((trigger: any) => (
                    <button
                        key={trigger.props.value}
                        onClick={() => setActive(trigger.props.value)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${active === trigger.props.value
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {trigger.props.children}
                    </button>
                ))}
            </div>
            <div className="flex-1 overflow-hidden">
                {contents.map((child: any) => {
                    if (child.props.value === active) {
                        return child;
                    }
                    return null;
                })}
            </div>
        </div>
    )
}

export function TabsList({ children }: { children: React.ReactNode }) { return <>{children}</> }
export function TabsTrigger({ children, value }: { children: React.ReactNode, value: string }) { return <>{children}</> }
export function TabsContent({ children, value }: { children: React.ReactNode, value: string }) {
    return <div className="h-full animate-in fade-in slide-in-from-bottom-2 duration-300">{children}</div>
}
