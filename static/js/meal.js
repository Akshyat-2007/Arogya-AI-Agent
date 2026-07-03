// Meal Plan Handler
document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generatePlanBtn');
    const planTypeSelect = document.getElementById('planTypeSelect');
    const printBtn = document.getElementById('printPlanBtn');
    const memberSelect = document.getElementById('mealMemberSelect');
    const planContainer = document.getElementById('planContainer');

    let currentMemberId = memberSelect ? memberSelect.value : null;

    // Switch member context
    if (memberSelect) {
        memberSelect.addEventListener('change', (e) => {
            currentMemberId = e.target.value;
            const url = new URL(window.location);
            url.searchParams.set('member_id', currentMemberId);
            window.location.href = url.toString();
        });
    }

    // Generate Plan Click
    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            if (!currentMemberId) return;

            const planType = planTypeSelect ? planTypeSelect.value : 'Daily';
            
            // Set loading state
            generateBtn.disabled = true;
            generateBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Crafting Plan...';

            if (planContainer) {
                planContainer.style.opacity = '0.5';
            }

            try {
                const response = await fetch(`/api/members/${currentMemberId}/meal-plan/generate`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ plan_type: planType })
                });

                const data = await response.json();

                if (response.ok) {
                    // Success: Reload page to show new plan
                    window.location.reload();
                } else {
                    alert(`Error: ${data.error || 'Failed to generate meal plan'}`);
                    generateBtn.disabled = false;
                    generateBtn.innerHTML = '<i class="fas fa-magic me-2"></i>Generate Plan';
                    if (planContainer) planContainer.style.opacity = '1';
                }
            } catch (err) {
                console.error("Failed to generate plan:", err);
                alert("Failed to generate plan due to server communication error.");
                generateBtn.disabled = false;
                generateBtn.innerHTML = '<i class="fas fa-magic me-2"></i>Generate Plan';
                if (planContainer) planContainer.style.opacity = '1';
            }
        });
    }

    // Print Plan Click
    if (printBtn) {
        printBtn.addEventListener('click', () => {
            // Apply simple style triggers for print
            window.print();
        });
    }
});
