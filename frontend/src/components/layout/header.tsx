"use client";

import { usePathname } from "next/navigation";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { navigation } from "@/config/navigation";
import Image from "next/image";
import { useModel } from "@/contexts/ModelContext";

const METRIC_SECTIONS = [
  {
    title: "Medical Metrics",
    metrics: [
      {
        name: "Medical Quality Score",
        description:
          "Measures the accuracy, completeness, and medical correctness of the answer.",
      },
    ],
    extra: (
      <div className="mb-4 space-y-2">
        <div>
          <span className="font-bold text-gray-800 dark:text-gray-200">
            Rubric:
          </span>
          <span className="ml-1 text-gray-700 dark:text-gray-300">
            A rubric is a specific criterion or guideline used to evaluate a
            particular aspect of a medical answer, such as accuracy,
            completeness, or use of terminology.
          </span>
        </div>
        <div>
          <span className="font-bold text-gray-800 dark:text-gray-200">
            Axes:
          </span>
          <span className="ml-1 text-gray-700 dark:text-gray-300">
            Axes are broader categories or dimensions (e.g., accuracy, context,
            communication) under which multiple rubrics may be grouped for
            evaluation.
          </span>
        </div>
      </div>
    ),
  },
  {
    title: "Semantic Metrics",
    metrics: [
      {
        name: "Cosine Similarity",
        description:
          "Measures the cosine of the angle between two vectors, used here for semantic similarity between answers.",
      },
      {
        name: "BERT Score F1",
        description:
          "Uses BERT embeddings to compare similarity between generated and reference text at a deeper semantic level.",
      },
      {
        name: "Semantic Similarity",
        description:
          "General measure of how close the generated answer is to the gold standard in meaning.",
      },
    ],
  },
  {
    title: "Linguistic Metrics",
    metrics: [
      {
        name: "BLEU Score",
        description:
          "A metric for evaluating a generated sentence to a reference sentence, based on n-gram overlap.",
      },
      {
        name: "ROUGE-L Score",
        description:
          "Measures the longest common subsequence between the generated and reference text, used for summarization tasks.",
      },
      {
        name: "METEOR Score",
        description:
          "Considers exact, stem, synonym, and paraphrase matches between generated and reference text.",
      },
      {
        name: "Linguistic Quality Score",
        description:
          "Assesses grammar, fluency, and readability of the answer.",
      },
    ],
  },
];

export default function Header() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const { selectedModel } = useModel();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const getPageTitle = (path: string) => {
    const segments = path.split("/").filter(Boolean);
    if (segments.length === 0) return "Home";

    const lastSegment = segments[segments.length - 1];
    return (
      lastSegment.charAt(0).toUpperCase() +
      lastSegment.slice(1).replace("-", " ")
    );
  };

  return (
    <header className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-800 px-4 py-3 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {/* Hamburger for mobile */}
          <button
            className="sm:hidden mr-3 p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Open navigation menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          {/* Logo for mobile, full text for desktop */}
          <Link href="/" className="flex items-center">
            <span className="block sm:hidden">
              <Image
                src="/icons/simppl_icon.png"
                alt="Logo"
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
              />
            </span>
            <div className="hidden sm:block ml-2">
              <div className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">
                {getPageTitle(pathname)}
              </div>
              {selectedModel && (
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Model:{" "}
                  {selectedModel
                    .replace(/-/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </div>
              )}
            </div>
          </Link>
        </div>
        <div className="flex items-center">
          <button
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Show metric info"
            onClick={() => setInfoOpen(true)}
          >
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16v-4M12 8h.01"
              />
            </svg>
          </button>
        </div>
      </div>
      {/* Dropdown menu for mobile */}
      {menuOpen && (
        <div
          ref={dropdownRef}
          className="absolute left-0 top-full w-full bg-neutral-950 dark:bg-neutral-950 border-b border-neutral-800 dark:border-neutral-800 z-50 sm:hidden shadow-md animate-fade-in"
        >
          <nav className="px-4 py-2 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                  pathname === item.href
                    ? "bg-neutral-800 dark:bg-neutral-800 text-neutral-100 dark:text-neutral-100"
                    : "text-neutral-300 dark:text-neutral-300 hover:bg-neutral-900 dark:hover:bg-neutral-900"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
      )}
      {/* Info Modal */}
      {infoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 px-2">
          <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-lg w-full max-w-xs md:max-w-md p-4 md:p-6 relative overflow-y-auto max-h-[90vh]">
            <button
              className="absolute top-1.5 right-1.5 p-3 md:top-2 md:right-2 rounded-full hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500"
              aria-label="Close metric info"
              onClick={() => setInfoOpen(false)}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <h2 className="text-base font-semibold mb-4 md:mb-6 text-gray-900 dark:text-white">
              Metric Explanations
            </h2>
            <div className="space-y-4 md:space-y-6">
              {METRIC_SECTIONS.map((section, idx) => (
                <div key={section.title}>
                  <h3 className="text-sm font-bold text-blue-700 dark:text-blue-300 mb-2 md:mb-3">
                    {section.title}
                  </h3>
                  {section.extra && (
                    <div className="mb-4 space-y-2 text-sm">
                      {section.extra}
                    </div>
                  )}
                  <ul className="space-y-3 text-xs">
                    {section.metrics.map((metric) => (
                      <li key={metric.name}>
                        <span className="font-bold text-gray-800 dark:text-gray-200">
                          {metric.name}:
                        </span>
                        <span className="ml-1 text-gray-700 dark:text-gray-300 break-words">
                          {metric.description}
                        </span>
                      </li>
                    ))}
                  </ul>
                  {idx < METRIC_SECTIONS.length - 1 && (
                    <div className="my-4 md:my-6 border-t border-gray-200 dark:border-gray-700" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
