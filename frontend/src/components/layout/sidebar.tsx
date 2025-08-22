// components/layout/Sidebar.tsx
"use client";

import { usePathname } from "next/navigation";
import { navigation } from "@/config/navigation";
import Image from "next/image";
import Link from "next/link";
import { useModel } from "@/contexts/ModelContext";
import { useSidebar } from "@/contexts/SidebarContext";
import Dropdown from "@/components/ui/dropdown";

export default function Sidebar() {
  const pathname = usePathname();
  const {
    selectedDataset,
    availableDatasets,
    setSelectedDataset,
    selectedModel,
    availableModels,
    setSelectedModel,
    isLoading,
  } = useModel();
  const { isCollapsed, toggleSidebar } = useSidebar();

  const datasetOptions = availableDatasets.map((d) => ({
    value: d,
    label: d.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  const modelOptions = availableModels.map((m) => ({
    value: m,
    label: m.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
  }));

  return (
    <div
      className={`bg-neutral-100 dark:bg-neutral-900 ${isCollapsed ? "w-16" : "w-52"} min-h-screen border-r border-neutral-200 dark:border-neutral-800 hidden sm:block relative transition-all duration-300 ease-in-out`}>
      
      {/* Section for the collapsable sidebar and Sidebar Heading*/}
      <div className="px-5 py-6 flex items-center justify-between">
        <Link href="/" className="group flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100 transition-all duration-200 hover:text-blue-600 dark:hover:text-blue-400 hover:scale-105 cursor-pointer">
          <Image src="/icons/simppl_icon.png" alt="" width={20} height={20} className="object-contain flex-shrink-0" />
          {!isCollapsed && <span>Medical QA</span>}
        </Link>
        <button onClick={toggleSidebar} className="p-1.5 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors" aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}>
          <svg className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>


      {/* Dataset Selection */}
      {!isCollapsed && (
        <div className="px-3 mb-4">
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">Select Dataset</label>
          <Dropdown
            options={datasetOptions}
            value={selectedDataset ?? ""}
            onChange={setSelectedDataset}
            placeholder="Loading datasets..."
            disabled={isLoading}
            className="w-full"
          />
        </div>
      )}

      {/*Section for showing different pages*/}
      <nav className="px-2">
      <br/>
        <div className="space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center ${isCollapsed ? "px-3 py-2 justify-center" : "px-3 py-2"} text-sm font-medium rounded-md transition-colors ${
                pathname === item.href
                  ? "bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100"
                  : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100"
              }`}
              title={isCollapsed ? item.name : undefined}>
              <span className={isCollapsed ? "" : "mr-3"}>{item.icon}</span>
              {!isCollapsed && item.name}
            </Link>
          ))}
        </div>
        <br/>
      </nav>


      {/* Model Selection */}
      {!isCollapsed && (
        <div className="px-3 mb-4">
          <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-2">Select Model</label>
          <Dropdown
            options={modelOptions}
            value={selectedModel ?? ""}
            onChange={setSelectedModel}
            placeholder="Loading models..."
            disabled={isLoading}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
