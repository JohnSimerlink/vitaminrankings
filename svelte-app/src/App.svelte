<script>
	export let name;
	import Progress from './Progress.svelte';
	let questionsCorrect = 3;
	let totalQuestions = 7;
	let pointsEarned = 0; // Added to track the total points earned
	let questionInput = '';
	async function _gradeQuestion() {
		console.log('_gradeQuestion')
		return new Promise((resolve, reject) => {
			console.log("about to resolve promise")
			resolve({
				numberOfPoints: 1,
				questionNumberAnsweredCorrectly: 1
			})
		})
	}
	function gradeQuestion() {
		console.log('gradeQuestion')
		// Assuming gradeQuestion is an async function that returns a promise
		// with the structure {numberOfPoints, questionNumberAnsweredCorrectly}
		_gradeQuestion(questionInput).then(({numberOfPoints, questionNumberAnsweredCorrectly}) => {
			console.log('gradeQuestion.then called')
			// questionsCorrect += questionNumberAnsweredCorrectly;
			// totalQuestions += numberOfPoints; // Assuming numberOfPoints represents the total questions attempted
			pointsEarned += numberOfPoints; // Update pointsEarned based on correct answers
			questionInput = ''; // Reset input after grading
		});
	}
</script>

<main>
	<div class="quiz">
		<form on:submit|preventDefault={gradeQuestion}>
			<input type="text" bind:value={questionInput} placeholder="Enter your question here" />
			<button type="submit">Submit</button>
		</form>
		<div class="progress-container">
			<Progress numerator={questionsCorrect} denominator={totalQuestions} />
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
		margin-top: 1em; /* Added margin for spacing */
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