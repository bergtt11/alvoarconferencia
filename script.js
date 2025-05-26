document.addEventListener('DOMContentLoaded', () => {
    const navButtons = document.querySelectorAll('.nav-button');
    const views = document.querySelectorAll('.view');
    const mainContent = document.getElementById('app-main');
    
    const registerIssueForm = document.getElementById('register-issue-form');
    const fichaCodeInput = document.getElementById('ficha-code');
    const issueDescriptionInput = document.getElementById('issue-description');
    const issuesListContainer = document.getElementById('issues-list-container');

    const ISSUES_STORAGE_KEY = 'alvoarLacteosIssues';

    let issues = loadIssues();

    function switchView(viewId) {
        views.forEach(view => view.classList.remove('active-view'));
        const activeView = document.getElementById(viewId);
        if (activeView) {
            activeView.classList.add('active-view');
        }
        if (mainContent) {
            mainContent.scrollTop = 0;
        }
        // Always re-render issues when switching to issues-view to reflect any changes
        if (viewId === 'issues-view') {
            renderIssues();
        }
    }

    navButtons.forEach(button => {
        button.addEventListener('click', () => {
            navButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const viewId = button.getAttribute('data-view');
            switchView(viewId);
        });
    });

    function loadIssues() {
        const storedIssues = localStorage.getItem(ISSUES_STORAGE_KEY);
        return storedIssues ? JSON.parse(storedIssues) : [];
    }

    function saveIssues() {
        localStorage.setItem(ISSUES_STORAGE_KEY, JSON.stringify(issues));
    }

    function formatDate(isoString) {
        if (!isoString) return '';
        const date = new Date(isoString);
        return date.toLocaleString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    function renderIssues() {
        issuesListContainer.innerHTML = ''; // Clear existing issues

        if (issues.length === 0) {
            issuesListContainer.innerHTML = '<p class="no-issues-message">Nenhum problema registrado ainda. Use a aba "Registrar" para adicionar um.</p>';
            return;
        }
        
        // Sort issues: Pending, then Checked, then Resolved. Within statuses, newest first.
        issues.sort((a, b) => {
            const statusOrder = { 'Pendente': 1, 'Conferido': 2, 'Resolvido': 3 };
            if (statusOrder[a.status] !== statusOrder[b.status]) {
                return statusOrder[a.status] - statusOrder[b.status];
            }
            return new Date(b.registeredAt) - new Date(a.registeredAt);
        });


        issues.forEach(issue => {
            const issueCard = document.createElement('div');
            issueCard.classList.add('issue-card', `status-${issue.status}`);
            issueCard.dataset.issueId = issue.id;

            let actionsHtml = '';
            if (issue.status === 'Pendente') {
                actionsHtml = `<button class="mark-checked-btn" data-id="${issue.id}">Marcar como Conferido</button>`;
            } else if (issue.status === 'Conferido') {
                actionsHtml = `<button class="mark-resolved-btn" data-id="${issue.id}">Marcar como Resolvido</button>`;
            }

            issueCard.innerHTML = `
                <p><strong>Ficha:</strong> ${issue.fichaCode}</p>
                <p><strong>Problema:</strong> ${issue.description}</p>
                <p>
                    <strong>Status:</strong> 
                    <span class="status-badge status-${issue.status}">${issue.status}</span>
                </p>
                <p class="issue-meta">Registrado em: ${formatDate(issue.registeredAt)}</p>
                ${issue.checkedAt ? `<p class="issue-meta">Conferido em: ${formatDate(issue.checkedAt)}</p>` : ''}
                ${issue.resolvedAt ? `<p class="issue-meta">Resolvido em: ${formatDate(issue.resolvedAt)}</p>` : ''}
                <div class="issue-actions">
                    ${actionsHtml}
                </div>
            `;
            issuesListContainer.appendChild(issueCard);
        });

        // Add event listeners for action buttons
        document.querySelectorAll('.mark-checked-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const issueId = e.target.dataset.id;
                updateIssueStatus(parseInt(issueId), 'Conferido');
            });
        });
        document.querySelectorAll('.mark-resolved-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const issueId = e.target.dataset.id;
                updateIssueStatus(parseInt(issueId), 'Resolvido');
            });
        });
    }

    function addIssue(fichaCode, description) {
        const newIssue = {
            id: Date.now(),
            fichaCode,
            description,
            status: 'Pendente', // Initial status
            registeredAt: new Date().toISOString(),
            checkedAt: null,
            resolvedAt: null
        };
        issues.push(newIssue);
        saveIssues();
        renderIssues();
    }

    function updateIssueStatus(issueId, newStatus) {
        const issueIndex = issues.findIndex(issue => issue.id === issueId);
        if (issueIndex > -1) {
            issues[issueIndex].status = newStatus;
            if (newStatus === 'Conferido') {
                issues[issueIndex].checkedAt = new Date().toISOString();
            } else if (newStatus === 'Resolvido') {
                issues[issueIndex].resolvedAt = new Date().toISOString();
            }
            saveIssues();
            renderIssues(); // Re-render to reflect status change and button changes
        }
    }

    if (registerIssueForm) {
        registerIssueForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const ficha = fichaCodeInput.value.trim();
            const desc = issueDescriptionInput.value.trim();
            if (ficha && desc) {
                addIssue(ficha, desc);
                fichaCodeInput.value = '';
                issueDescriptionInput.value = '';
                alert('Problema registrado com sucesso!');
                // Optionally switch to issues view
                // switchView('issues-view');
                // navButtons.forEach(btn => btn.classList.remove('active'));
                // document.querySelector('.nav-button[data-view="issues-view"]').classList.add('active');
            } else {
                alert('Por favor, preencha todos os campos.');
            }
        });
    }

    // Initialize with the issues view and render issues
    switchView('issues-view'); 
    const issuesButton = document.querySelector('.nav-button[data-view="issues-view"]');
    if (issuesButton) {
        navButtons.forEach(btn => btn.classList.remove('active')); // Clear any default active
        issuesButton.classList.add('active');
    }
    renderIssues();


    // PWA Installation Prompt
    let deferredPrompt;
    const installPromptElement = document.createElement('div');
    installPromptElement.id = 'install-prompt';
    // Ensure there's an element to append to if needed, for now, it's hidden
    // and only shown if `beforeinstallprompt` fires.
    // document.body.appendChild(installPromptElement); // Appended only when needed

    const installButtonId = 'install-pwa-button'; // Unique ID

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        if (!document.getElementById('install-prompt')) { // Check if already added
             installPromptElement.innerHTML = `<span>Adicionar à tela inicial?</span><button id="${installButtonId}">Instalar</button>`;
             document.body.appendChild(installPromptElement); // Append only now
             
             const installPwaButton = document.getElementById(installButtonId);
             if(installPwaButton) {
                installPwaButton.addEventListener('click', async () => {
                    installPromptElement.style.display = 'none';
                    if (deferredPrompt) {
                        deferredPrompt.prompt();
                        const { outcome } = await deferredPrompt.userChoice;
                        console.log(`User response to the install prompt: ${outcome}`);
                        deferredPrompt = null;
                    }
                });
             }
        }
        installPromptElement.style.display = 'block'; // Show it
    });

    window.addEventListener('appinstalled', () => {
        if (document.getElementById('install-prompt')){
            installPromptElement.style.display = 'none';
        }
        console.log('PWA was installed');
        deferredPrompt = null;
    });

});