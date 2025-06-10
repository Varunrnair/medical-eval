import json
from rubrics_generator import RubricsGenerator
from score_calculator import ScoreCalculator

# Sample dataset for testing
SAMPLE_DATA = [
    {
        "question_id": "Q_001_IronDiet",
        "theme": "Nutrition in Pregnancy",
        "question": "What foods should I eat to get enough iron during pregnancy?",
        "ideal_answer": "During pregnancy, you need more iron to support your baby's growth. Good iron sources include lean red meat, poultry, fish, beans, lentils, spinach, and fortified cereals. Vitamin C helps your body absorb iron better, so eat citrus fruits, tomatoes, or bell peppers with iron-rich foods. Avoid tea and coffee with meals as they can reduce iron absorption. Always consult your doctor about iron supplements, as too much can be harmful.",
        "language_instructions": "Answer in English only, using simple and clear language suitable for pregnant women."
    },
    {
        "question_id": "Q_002_Exercise",
        "theme": "Physical Activity in Pregnancy", 
        "question": "Is it safe to exercise during pregnancy?",
        "ideal_answer": "Yes, exercise is generally safe and beneficial during pregnancy if you have no complications. Safe activities include walking, swimming, prenatal yoga, and light strength training. Exercise helps reduce back pain, improves mood, and may make labor easier. Avoid contact sports, activities with fall risk, and lying flat on your back after the first trimester. Start slowly if you're new to exercise. Always check with your doctor before starting any exercise program during pregnancy.",
        "language_instructions": "Answer in English only, using simple and clear language suitable for pregnant women."
    }
]

def main():
    # Initialize components
    rubrics_gen = RubricsGenerator(api_key="")
    score_calc = ScoreCalculator(api_key="")
    
    print("🏥 Medical QA Evaluation System")
    print("=" * 50)
    
    for idx, data in enumerate(SAMPLE_DATA):
        print(f"\n📋 Processing: {data['question_id']}")
        print(f"Question: {data['question']}")
        print(f"Ideal Answer: {data['ideal_answer']}")
        print(f"Theme: {data['theme']}")
        
        # Step 1: Generate rubrics based on ideal answer
        print("\n🔍 Generating rubrics...")
        rubrics = rubrics_gen.generate_rubrics(
            question=data['question'],
            ideal_answer=data['ideal_answer'],
            theme=data['theme']
        )
        print(f"Rubrics: {rubrics}")

        
        # Step 2: Generate LLM answer
        print("\n🤖 Generating LLM answer...")
        llm_answer = rubrics_gen.generate_llm_answer(
            question=data['question'],
            theme=data['theme'],
            language_instructions=data['language_instructions']
        )
        
        print(f"LLM Answer: {llm_answer}")
        
        # Step 3: Calculate scores
        print("\n📊 Calculating scores...")
        scores = score_calc.calculate_scores(
            question=data['question'],
            ideal_answer=data['ideal_answer'],
            llm_answer=llm_answer,
            rubrics=rubrics
        )
        
        # Display results
        print(f"\n📈 Results for {data['question_id']}:")
        print(f"Axis Scores:")
        for axis, score in scores['axis_scores'].items():
            print(f"  {axis}: {score:.3f}")
        print(f"Final Medical Quality Score: {scores['final_score']:.3f}")
        print("-" * 50)
        
        # Add delay between questions (except for the last one)
        if idx < len(SAMPLE_DATA) - 1:
            import time
            import random
            wait_time = random.uniform(8, 12)
            print(f"\n⏳ Waiting {wait_time:.1f}s before processing next question...")
            time.sleep(wait_time)

if __name__ == "__main__":
    main()

