<script>
	import { onMount } from 'svelte';
	import questions from './data.json';

	let todayQuestions = [];
	let currentQuestionIndex = 0;
	let currentQuestion = {};
	let today;
	let selectedDay;
	let previousDay;
	let nextDay;
	let scoring = {}; // Initialize scoring hashmap

	function calculateAdjacentDays() {
		console.log('calculateAdjacentDays')
		if (!selectedDay) return;
		const todayDate = new Date(selectedDay); // Use selectedDay instead of today
		console.log('selectedDay', selectedDay)
		const previousDate = new Date(todayDate);
		console.log('previousDate', previousDate.toISOString());
		previousDate.setDate(previousDate.getDate() - 1);
		console.log('previousDate', previousDate.toISOString());
		console.log('previousDate', previousDate.toISOString());
		console.log('previousDate', previousDate.toISOString());
		console.log('previousDate', previousDate.toISOString());
		console.log('previousDate', previousDate.toISOString());
		previousDay = previousDate.toISOString().slice(0, 10);

		const nextDate = new Date(todayDate);
		nextDate.setDate(nextDate.getDate() + 1);
		nextDay = nextDate.toISOString().slice(0, 10);
	}

	function loadQuestionsForDate(date) {
		todayQuestions = questions[date] || [];
		if (todayQuestions.length > 0) {
			currentQuestionIndex = 0;
			currentQuestion = todayQuestions[currentQuestionIndex];
			scoring = {}; // Reset scoring for new day
			todayQuestions.forEach((_, index) => scoring[index] = undefined);
		}
	}

	onMount(() => {
		today = new Date().toISOString().slice(0, 10); // Format: YYYY-MM-DD
		selectedDay = today;
		calculateAdjacentDays();
		loadQuestionsForDate(selectedDay);
	});

	$: selectedDay, calculateAdjacentDays(); // Recalculate adjacent days when selectedDay changes

	export let name;
	import Progress from './Progress.svelte';
	let questionsCorrect = 0;
	let totalQuestions = todayQuestions.length;
	let pointsEarned = 0;
	let answerInput = '';

	function changeDay(offset) {
		const newDay = new Date(selectedDay); // Use selectedDay instead of today
		newDay.setDate(newDay.getDate() + offset);
		const newDayStr = newDay.toISOString().slice(0, 10);
		if (questions[newDayStr]) {
			selectedDay = newDayStr; // Update selectedDay instead of today
			loadQuestionsForDate(selectedDay);
		}
	}

	// import { createClient } from '@openai/api';

	async function gradeAnswerWithAI(answer) {
		// const client = createClient({ apiKey: 'your_openai_api_key_here' });
		// const questionPrompt = `Based on the question: "${currentQuestion.question}", how well does the answer "${answer}" align on a scale from 0 to 3? 0 means not at all, 1 means slightly, 2 means moderately, and 3 means perfectly.`;
		// try {
		// 	const response = await client.createCompletion({
		// 		model: 'text-davinci-003',
		// 		prompt: questionPrompt,
		// 		temperature: 0.7,
		// 		max_tokens: 60,
		// 		top_p: 1.0,
		// 		frequency_penalty: 0.0,
		// 		presence_penalty: 0.0,
		// 	});
		// 	const score = parseInt(response.choices[0].text.trim());
		// 	return {
		// 		numberOfPoints: score,
		// 		questionNumberAnsweredCorrectly: score > 0 ? 1 : 0
		// 	};
		// } catch (error) {
		// 	console.error('Error grading answer with AI:', error);
		// 	// Fallback to a default score in case of an error
		// 	return { numberOfPoints: 0, questionNumberAnsweredCorrectly: 0 };
		}
	}

	function gradeAnswer() {
		_gradeAnswer(answerInput).then(({numberOfPoints, questionNumberAnsweredCorrectly}) => {
			pointsEarned += numberOfPoints;
			questionsCorrect += questionNumberAnsweredCorrectly;
			// Update scoring based on the answer correctness
			scoring[currentQuestionIndex] = questionNumberAnsweredCorrectly ? 3 : 0;
			answerInput = ''; // Reset input after grading
			if (currentQuestionIndex < todayQuestions.length - 1) {
				currentQuestionIndex++;
				currentQuestion = todayQuestions[currentQuestionIndex];
			}
		});
	}
</script>

<main>
	<div class='title'>
		<div>
			{#if questions[previousDay]}
				<button on:click={() => changeDay(-1)}>←</button>
			{/if}
			{selectedDay}
			{#if questions[nextDay]}
				<button on:click={() => changeDay(1)}>→</button>
			{/if}
		</div>
		<div>
			Healthle
		</div>
	</div>
	<div class="quiz">
		{#if todayQuestions.length === 0}
			<h1>No questions available today</h1>
		{/if}
		{#if todayQuestions.length > 0}
			<div class="current-question">
				<p>{currentQuestion.question}</p>
			</div>
		{/if}
		<form on:submit|preventDefault={gradeAnswer}>
			<input type="text" bind:value={answerInput} placeholder="Enter your Answer here" />
			<button type="submit">Submit</button>
		</form>
		<div class="progress-container">
			<Progress scoring={scoring} />
		</div>
		<!-- Display the points earned -->
		<div class="points-earned">
			Points Earned: {pointsEarned}
		</div>
	</div>
</main>

<style>
	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;
	}

	.progress-container, .points-earned {
		display: flex;
		justify-content: center;
		margin-top: 1em;
	}

	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>