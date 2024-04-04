<script>
	import { onMount } from 'svelte';
	import questions from './data.json';

	let todayQuestions = [];
	let currentQuestionIndex = 0;
	let currentQuestion = {};

	onMount(() => {
		const today = new Date().toISOString().slice(0, 10); // Format: YYYY-MM-DD
		console.log('today is ', today)
		todayQuestions = questions[today] || [];
		if (todayQuestions.length > 0) {
			currentQuestion = todayQuestions[currentQuestionIndex];
		}
	});
	export let name;
	import Progress from './Progress.svelte';
	let questionsCorrect = 0;
	let totalQuestions = todayQuestions.length;
	let pointsEarned = 0;
	let answerInput = '';

	async function _gradeAnswer(answer) {
		// Simulate grading answer
		if (answer.toLowerCase() === currentQuestion.answer.toLowerCase()) {
			return { numberOfPoints: 1, questionNumberAnsweredCorrectly: 1 };
		} else {
			return { numberOfPoints: 0, questionNumberAnsweredCorrectly: 0 };
		}
	}

	function gradeAnswer() {
		_gradeAnswer(answerInput).then(({numberOfPoints, questionNumberAnsweredCorrectly}) => {
			pointsEarned += numberOfPoints;
			questionsCorrect += questionNumberAnsweredCorrectly;
			answerInput = ''; // Reset input after grading
			if (currentQuestionIndex < todayQuestions.length - 1) {
				currentQuestionIndex++;
				currentQuestion = todayQuestions[currentQuestionIndex];
			}
		});
	}
</script>

<main>
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
			<Progress numerator={questionsCorrect} denominator={todayQuestions.length} />
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