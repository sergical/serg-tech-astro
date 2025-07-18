<script>
  import { onMount } from 'svelte';

  let displayText = '';
  let currentIndex = 0;
  const texts = ['sergiy dybskiy', 'serge'];
  let isTyping = true;
  let isClearing = false;
  let shouldBlink = false;

  onMount(() => {
    let timeout;
    
    const typeText = () => {
      const currentText = texts[currentIndex];
      
      if (isTyping) {
        if (displayText.length < currentText.length) {
          displayText = currentText.slice(0, displayText.length + 1);
          timeout = setTimeout(typeText, 100); // Typing speed
        } else {
          // Finished typing, wait then start clearing
          shouldBlink = true;
          timeout = setTimeout(() => {
            shouldBlink = false;
            isTyping = false;
            isClearing = true;
            clearText();
          }, 2000); // Pause before clearing
        }
      }
    };

    const clearText = () => {
      if (displayText.length > 0) {
        displayText = displayText.slice(0, -1);
        timeout = setTimeout(clearText, 50); // Clearing speed
      } else {
        // Finished clearing, move to next text
        isClearing = false;
        shouldBlink = true;
        currentIndex = (currentIndex + 1) % texts.length;
        timeout = setTimeout(() => {
          shouldBlink = false;
          isTyping = true;
          typeText();
        }, 500); // Pause before next text
      }
    };

    // Start the animation
    typeText();

    // Cleanup function
    return () => {
      if (timeout) clearTimeout(timeout);
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