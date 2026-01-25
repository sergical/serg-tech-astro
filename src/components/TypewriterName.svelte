<script>
  import { onMount } from 'svelte';

  // Props - optional texts array
  export let texts = ['sergiy dybskiy', 'serge'];

  // State variables
  let displayText = '';
  let currentTextIndex = 0;
  let isTyping = true;
  let shouldBlink = false;
  let timeoutId;
  let initialized = false;

  // Configuration
  const TYPING_SPEED = 100;
  const CLEARING_SPEED = 50;
  const PAUSE_AFTER_TYPING = 2000;
  const PAUSE_BEFORE_TYPING = 500;
  
  // Determine if we should loop (multiple texts) or stop after first (single text)
  $: shouldLoop = texts.length > 1;

  const typeText = () => {
    const currentText = texts[currentTextIndex];
    
    if (isTyping) {
      if (displayText.length < currentText.length) {
        displayText = currentText.slice(0, displayText.length + 1);
        timeoutId = setTimeout(typeText, TYPING_SPEED);
      } else {
        // Finished typing
        shouldBlink = true;
        
        // Only continue cycling if there are multiple texts
        if (shouldLoop) {
          timeoutId = setTimeout(() => {
            shouldBlink = false;
            isTyping = false;
            clearText();
          }, PAUSE_AFTER_TYPING);
        }
        // If single text, just keep blinking cursor at end
      }
    }
  };

  const clearText = () => {
    if (displayText.length > 0) {
      displayText = displayText.slice(0, -1);
      timeoutId = setTimeout(clearText, CLEARING_SPEED);
    } else {
      // Finished clearing, move to next text
      shouldBlink = true;
      currentTextIndex = (currentTextIndex + 1) % texts.length;
      timeoutId = setTimeout(() => {
        shouldBlink = false;
        isTyping = true;
        typeText();
      }, PAUSE_BEFORE_TYPING);
    }
  };

  const startAnimation = () => {
    if (timeoutId) clearTimeout(timeoutId);
    displayText = '';
    currentTextIndex = 0;
    isTyping = true;
    shouldBlink = false;
    typeText();
  };

  onMount(() => {
    initialized = true;
    startAnimation();

    // Cleanup function
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  });

  // Restart animation when texts prop changes (after initial mount)
  $: if (initialized && texts) {
    startAnimation();
  }
</script>

<span class="font-bold flex items-center min-h-[1.5em] max-w-full">
  <span class="truncate">{displayText}</span><span class="inline-block ml-1 flex-shrink-0" class:animate-blink={shouldBlink}>█</span>
</span>

<style>
  @keyframes blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0; }
  }
  
  .animate-blink {
    animation: blink 1s infinite;
  }
</style>
