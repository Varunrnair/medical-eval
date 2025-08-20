"use client"

import Link from "next/link"
import { ArrowRight, Brain, BarChart3, MessageSquare, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"



export default function HomePage() {
  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Navigation */}
      <nav className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo only on mobile, logo + text on desktop */}
            <Link href="/" className="flex items-center">
              <span className="block">
                <Image src="/icons/simppl_icon.png" alt="Logo" width={28} height={28} className="h-7 w-7 object-contain" />
              </span>
              <span className="hidden sm:inline text-xl font-bold text-white ml-2">Medical QA Evaluator</span>
            </Link>
            <Link href="/dashboard">
              <Button className="flex items-center gap-2 bg-neutral-700 hover:bg-neutral-700 px-4 py-2 sm:px-6 whitespace-nowrap text-sm sm:text-base">
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

        {/* Hero Section */}
        <section className="py-12 px-3 sm:py-20 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">
            Advanced LLM Evaluation for
            <span className="bg-gradient-to-r from-teal-400 to-indigo-400 bg-clip-text text-transparent block text-lg sm:text-2xl">
                Medical Question Answering
            </span>
            </h1>
            <p className="text-base sm:text-lg text-neutral-300 mb-6 sm:mb-8 leading-relaxed">
            Comprehensive analysis and comparison of Large Language Model responses against gold standard medical
            answers using multi-dimensional evaluation metrics.
            </p>
            <Link href="/dashboard">
            <Button className="flex items-center justify-center gap-2 bg-neutral-700 hover:bg-neutral-600 text-white px-5 py-2 sm:px-6 sm:py-2 mx-auto text-base sm:text-lg">
                Start Evaluating
                <ArrowRight className="h-5 w-5" />
            </Button>
            </Link>
        </div>
        </section>


      {/* Theory Section */}
      <section className="py-10 px-3 sm:py-16 sm:px-6 lg:px-8 bg-neutral-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-4">Evaluation Framework</h2>
            <p className="text-base sm:text-lg text-neutral-300">
              Our comprehensive evaluation system analyzes LLM responses across multiple dimensions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            <Card className="bg-neutral-850 hover:shadow-2xl shadow-md transition-all duration-300">
              <CardHeader>
                <Target className="h-8 w-8 sm:h-10 sm:w-10 text-teal-400 mb-3 sm:mb-4" />
                <CardTitle className="text-base sm:text-xl text-white">Medical Quality</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-neutral-300">
                  Evaluates medical accuracy, completeness, context awareness, communication quality, and terminology
                  accessibility
                </CardDescription>
              </CardHeader>
              <CardContent>
                <br/>
                <ul className="text-xs sm:text-sm text-neutral-300 space-y-1 sm:space-y-2">
                  <li>• Medical Accuracy Assessment</li>
                  <li>• Completeness Evaluation</li>
                  <li>• Context Awareness Analysis</li>
                  <li>• Communication Quality Review</li>
                  <li>• Terminology Accessibility Check</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-neutral-850 hover:shadow-2xl shadow-md transition-all duration-300">
              <CardHeader>
                <MessageSquare className="h-8 w-8 sm:h-10 sm:w-10 text-indigo-400 mb-3 sm:mb-4" />
                <CardTitle className="text-base sm:text-xl text-white">Semantic Similarity</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-neutral-300">
                  Measures semantic alignment between LLM responses and gold standard answers using advanced NLP metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <br/>
                <ul className="text-xs sm:text-sm text-neutral-300 space-y-1 sm:space-y-2">
                  <li>• Cosine Similarity Analysis</li>
                  <li>• BERT Score F1 Evaluation</li>
                  <li>• Semantic Similarity Scoring</li>
                  <li>• Vyakyarth Similarity Metrics</li>
                  <li>• Cross-metric Correlation</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-neutral-850 hover:shadow-2xl shadow-md transition-all duration-300">
              <CardHeader>
                <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-purple-400 mb-3 sm:mb-4" />
                <CardTitle className="text-base sm:text-xl text-white">Linguistic Quality</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-neutral-300">
                  Analyzes language fluency, grammar, readability, and overall linguistic quality of responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <br/>
                <ul className="text-xs sm:text-sm text-neutral-300 space-y-1 sm:space-y-2">
                  <li>• BLEU Score Assessment</li>
                  <li>• METEOR Score Analysis</li>
                  <li>• ROUGE-L Score Evaluation</li>
                  <li>• Linguistic Quality Metrics</li>
                  <li>• Readability Analysis</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Methodology Section */}
      <section className="py-10 px-3 sm:py-16 sm:px-6 lg:px-8 bg-neutral-950">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg sm:text-2xl font-bold text-white mb-6 sm:mb-8 text-center">How It Works</h2>
          <div className="space-y-6 sm:space-y-8">
            {["Dataset Selection", "Multi-Model Comparison", "Comprehensive Analysis"].map((title, i) => (
              <div key={i} className="flex items-start space-x-3 sm:space-x-4">
                <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 border-2 border-teal-400 text-teal-400 rounded-full flex items-center justify-center font-semibold text-base sm:text-lg">
                  {i + 1}
                </div>
                <div>
                  <h3 className="text-base sm:text-xl font-semibold text-white mb-1 sm:mb-2">{title}</h3>
                  <p className="text-neutral-300 text-sm sm:text-base">
                    {title === "Dataset Selection"
                      ? "Choose from multiple medical QA datasets to evaluate LLM performance across different medical domains and question types."
                      : title === "Multi-Model Comparison"
                      ? "Compare responses from multiple LLM models against gold standard answers using our comprehensive evaluation framework."
                      : "Get detailed insights through interactive visualizations, performance metrics, and comparative analysis across all evaluation dimensions."}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 px-3 sm:py-16 sm:px-6 lg:px-8 bg-gradient-to-r from-neutral-800 to-neutral-900">
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-lg sm:text-2xl font-bold text-white mb-3 sm:mb-4">Ready to Evaluate Your Models?</h2>
            <p className="text-base sm:text-xl text-neutral-300 mb-6 sm:mb-8">
            Start analyzing LLM performance with our comprehensive evaluation dashboard
            </p>
            <Link href="/dashboard">
            <Button className="flex items-center justify-center gap-2 text-base sm:text-lg px-6 sm:px-8 py-2 sm:py-3 bg-neutral-700 hover:bg-neutral-600 text-white border-0 mx-auto">
                Access Dashboard
                <ArrowRight className="h-5 w-5" />
            </Button>
            </Link>
        </div>
        </section>


      {/* Footer */}
      <footer className="bg-neutral-900 text-white py-6 px-3 sm:py-8 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-3 sm:mb-4">
            <Brain className="h-5 w-5 sm:h-6 sm:w-6 text-teal-400" />
            <span className="text-base sm:text-lg font-semibold">Medical QA Evaluator</span>
          </div>
          <p className="text-neutral-500 text-xs sm:text-sm">Advanced LLM evaluation for medical question answering</p>
        </div>
      </footer>
    </div>
  )
}
