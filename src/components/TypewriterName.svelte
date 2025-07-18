<script>
  import { onMount } from 'svelte';

  // State variables
  let displayText = '';
  let currentTextIndex = 0;
  let isTyping = true;
  let shouldBlink = false;

  // Configuration
  const TEXTS = ['sergiy dybskiy', 'serge'];
  const TYPING_SPEED = 100;
  const CLEARING_SPEED = 50;
  const PAUSE_AFTER_TYPING = 2000;
  const PAUSE_BEFORE_TYPING = 500;

  onMount(() => {
    let timeoutId;
    
    const typeText = () => {
      const currentText = TEXTS[currentTextIndex];
      
      if (isTyping) {
        if (displayText.length < currentText.length) {
          displayText = currentText.slice(0, displayText.length + 1);
          timeoutId = setTimeout(typeText, TYPING_SPEED);
        } else {
          // Finished typing, pause then start clearing
          shouldBlink = true;
          timeoutId = setTimeout(() => {
            shouldBlink = false;
            isTyping = false;
            clearText();
          }, PAUSE_AFTER_TYPING);
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
        currentTextIndex = (currentTextIndex + 1) % TEXTS.length;
        timeoutId = setTimeout(() => {
          shouldBlink = false;
          isTyping = true;
          typeText();
        }, PAUSE_BEFORE_TYPING);
      }
    };

    // Start the animation
    typeText();

    // Cleanup function
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  });
</script>

<span class="font-bold flex items-center">
  {displayText}<span class="inline-block ml-1" class:animate-blink={shouldBlink}>█</span>
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