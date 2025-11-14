class SimpleNotesEditor {
    constructor() {
        this.savedSelection = null;
        this.isDragging = false;
        this.emojiChoices = [
            '🌙', // moon
            '☀️', // sun
            '⭐', // star
            '🌟', // glowing star
            '🦉', // owl
            '🥷', // ninja
            '🦑', // squid
            '🐸', // frog
            '🌿', // herb
            '🌱', // seedling
            '🌻', // sunflower
            '🍀', // four leaf clover
            '🌵', // cactus
            '🌈', // rainbow
            '🌪️', // tornado
            '☁️', // cloud
            '🌤️', // sun behind small cloud
            '💰', // money bag
            '💸', // money with wings
            '💡'  // light bulb
        ];

        this.formatTypes = [
            { type: 'h1', label: 'Heading 1', icon: 'H1', shortcut: '# ' },
            { type: 'h2', label: 'Heading 2', icon: 'H2', shortcut: '## ' },
            { type: 'h3', label: 'Heading 3', icon: 'H3', shortcut: '### ' },
            { type: 'bullet', label: 'Bulleted list', icon: '•', shortcut: '- ' },
            { type: 'number', label: 'Numbered list', icon: '1.', shortcut: '1. ' },
            { type: 'checkbox', label: 'Checkbox', icon: '☐', shortcut: '- [ ] ' },
            { type: 'bold', label: 'Bold', icon: 'B', shortcut: '**' },
            { type: 'italic', label: 'Italic', icon: 'I', shortcut: '*' }
        ];

        this.initializeElements();
        this.loadState();
        this.attachGlobalListeners();
    }

    initializeElements() {
        this.textarea = document.getElementById('notes-textarea');
        this.titleEl = document.getElementById('notes-title');
        this.emojiButton = document.getElementById('emoji-button');
        this.emojiMenu = document.getElementById('emoji-menu');
        this.emojiOptions = document.getElementById('emoji-options');
        this.emojiSearch = document.getElementById('emoji-search');
        this.emojiRemove = document.getElementById('emoji-remove');
        this.emojiAddButton = document.getElementById('emoji-add-button');
        this.formatMenu = document.getElementById('format-menu');
        this.formatMenuItems = document.getElementById('format-menu-items');

        this.titleEl.addEventListener('input', () => {
            localStorage.setItem('notesTitle', this.titleEl.innerText.trim() || 'Notes');
        });

        this.textarea.addEventListener('input', () => {
            localStorage.setItem('notesContent', this.textarea.innerHTML);
        });

        // Handle Enter key to create new lines
        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    
                    // Check if cursor is inside a checkbox container
                    let currentNode = range.startContainer;
                    let checkboxContainer = null;
                    
                    // Walk up the DOM tree to find checkbox container
                    while (currentNode && currentNode !== this.textarea) {
                        if (currentNode.nodeType === Node.ELEMENT_NODE) {
                            const element = currentNode;
                            // Check if this is a checkbox container (has display: flex and contains a checkbox)
                            if (element.style.display === 'flex' && 
                                element.querySelector('input[type="checkbox"]')) {
                                checkboxContainer = element;
                                break;
                            }
                        }
                        currentNode = currentNode.parentNode;
                    }
                    
                    // Only prevent default if we're inside a checkbox container
                    if (checkboxContainer) {
                        e.preventDefault();
                        
                        // Create a new checkbox container
                        const newContainer = document.createElement('div');
                        newContainer.style.display = 'flex';
                        newContainer.style.alignItems = 'center';
                        newContainer.style.gap = '0.5em';
                        newContainer.style.margin = '0.25em 0';
                        
                        const newCheckbox = document.createElement('input');
                        newCheckbox.type = 'checkbox';
                        newCheckbox.style.cursor = 'pointer';
                        
                        const newLabel = document.createElement('span');
                        // Add event listener to toggle strike-through
                        newCheckbox.addEventListener('change', () => {
                            if (newCheckbox.checked) {
                                newLabel.style.textDecoration = 'line-through';
                                newLabel.style.opacity = '0.6';
                            } else {
                                newLabel.style.textDecoration = 'none';
                                newLabel.style.opacity = '1';
                            }
                        });
                        
                        newContainer.appendChild(newCheckbox);
                        newContainer.appendChild(newLabel);
                        
                        // Insert the new checkbox container after the current one
                        if (checkboxContainer.nextSibling) {
                            checkboxContainer.parentNode.insertBefore(newContainer, checkboxContainer.nextSibling);
                        } else {
                            checkboxContainer.parentNode.appendChild(newContainer);
                        }
                        
                        // Place cursor in the new label
                        // Use requestAnimationFrame to ensure DOM is fully rendered
                        requestAnimationFrame(() => {
                            const currentSelection = window.getSelection();
                            const newRange = document.createRange();
                            
                            // Create a text node with a space to ensure proper cursor positioning
                            // The space will be removed when user starts typing
                            const textNode = document.createTextNode(' ');
                            newLabel.appendChild(textNode);
                            
                            // Place cursor at the end of the space (position 1)
                            // The space ensures proper visual positioning with the gap
                            newRange.setStart(textNode, 1);
                            newRange.setEnd(textNode, 1);
                            currentSelection.removeAllRanges();
                            currentSelection.addRange(newRange);
                            
                            // Ensure textarea has focus
                            this.textarea.focus();
                        });
                        
                        // Trigger input event to save
                        const inputEvent = new Event('input', { bubbles: true });
                        this.textarea.dispatchEvent(inputEvent);
                    }
                    // Otherwise, let the browser handle Enter naturally
                }
            }
        });

        // Handle Tab key to indent text
        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !e.shiftKey) {
                e.preventDefault();
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    
                    // Check if cursor is inside a checkbox container
                    let currentNode = range.startContainer;
                    let checkboxContainer = null;
                    
                    while (currentNode && currentNode !== this.textarea) {
                        if (currentNode.nodeType === Node.ELEMENT_NODE) {
                            const element = currentNode;
                            if (element.style.display === 'flex' && 
                                element.querySelector('input[type="checkbox"]')) {
                                checkboxContainer = element;
                                break;
                            }
                        }
                        currentNode = currentNode.parentNode;
                    }
                    
                    // Indent checkbox container
                    if (checkboxContainer) {
                        const currentMargin = parseInt(checkboxContainer.style.marginLeft) || 0;
                        checkboxContainer.style.marginLeft = `${currentMargin + 2}em`;
                    } else {
                        // For regular text, insert 4 spaces at cursor position
                        const indent = '    '; // 4 spaces
                        const indentNode = document.createTextNode(indent);
                        
                        // Delete any selected content first
                        range.deleteContents();
                        
                        // Insert the indent
                        range.insertNode(indentNode);
                        
                        // Move cursor after the indent
                        range.setStartAfter(indentNode);
                        range.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                    
                    // Trigger input event to save
                    const inputEvent = new Event('input', { bubbles: true });
                    this.textarea.dispatchEvent(inputEvent);
                }
            } else if (e.key === 'Tab' && e.shiftKey) {
                // Shift+Tab to unindent
                e.preventDefault();
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    
                    // Check if cursor is inside a checkbox container
                    let currentNode = range.startContainer;
                    let checkboxContainer = null;
                    
                    while (currentNode && currentNode !== this.textarea) {
                        if (currentNode.nodeType === Node.ELEMENT_NODE) {
                            const element = currentNode;
                            if (element.style.display === 'flex' && 
                                element.querySelector('input[type="checkbox"]')) {
                                checkboxContainer = element;
                                break;
                            }
                        }
                        currentNode = currentNode.parentNode;
                    }
                    
                    // Unindent checkbox container
                    if (checkboxContainer) {
                        const currentMargin = parseInt(checkboxContainer.style.marginLeft) || 0;
                        const newMargin = Math.max(0, currentMargin - 2);
                        checkboxContainer.style.marginLeft = newMargin > 0 ? `${newMargin}em` : '';
                    } else {
                        // For regular text, remove spaces before cursor (up to 4 spaces)
                        const textNode = range.startContainer;
                        const offset = range.startOffset;
                        
                        if (textNode.nodeType === Node.TEXT_NODE && offset > 0) {
                            const textBefore = textNode.textContent.substring(0, offset);
                            const textAfter = textNode.textContent.substring(offset);
                            
                            // Find spaces at the end of textBefore (up to 4)
                            const spaceMatch = textBefore.match(/[ ]{1,4}$/);
                            if (spaceMatch) {
                                const spacesToRemove = spaceMatch[0].length;
                                const newText = textBefore.substring(0, offset - spacesToRemove) + textAfter;
                                textNode.textContent = newText;
                                
                                // Adjust cursor position
                                const newOffset = offset - spacesToRemove;
                                const newRange = document.createRange();
                                newRange.setStart(textNode, newOffset);
                                newRange.setEnd(textNode, newOffset);
                                selection.removeAllRanges();
                                selection.addRange(newRange);
                            }
                        }
                    }
                    
                    // Trigger input event to save
                    const inputEvent = new Event('input', { bubbles: true });
                    this.textarea.dispatchEvent(inputEvent);
                }
            }
        });

        // Handle Backspace key to delete checkbox when label is empty
        this.textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace') {
                const selection = window.getSelection();
                if (selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    
                    // Check if cursor is inside a checkbox container
                    let currentNode = range.startContainer;
                    let checkboxContainer = null;
                    
                    while (currentNode && currentNode !== this.textarea) {
                        if (currentNode.nodeType === Node.ELEMENT_NODE) {
                            const element = currentNode;
                            if (element.style.display === 'flex' && 
                                element.querySelector('input[type="checkbox"]')) {
                                checkboxContainer = element;
                                break;
                            }
                        }
                        currentNode = currentNode.parentNode;
                    }
                    
                    // If inside a checkbox container, check if label is empty
                    if (checkboxContainer) {
                        const label = checkboxContainer.querySelector('span');
                        if (label) {
                            // Get text content (trim to ignore whitespace like the initial space)
                            const labelText = label.textContent.trim();
                            
                            // Check if cursor is in the label
                            const cursorInLabel = label.contains(range.startContainer) || range.startContainer === label;
                            
                            // If label is empty and cursor is in the label, delete the checkbox
                            if (labelText === '' && cursorInLabel) {
                                e.preventDefault();
                                
                                // Place cursor appropriately after deletion
                                if (checkboxContainer.nextSibling) {
                                    // Place cursor before next sibling
                                    const newRange = document.createRange();
                                    newRange.setStartBefore(checkboxContainer.nextSibling);
                                    newRange.collapse(true);
                                    selection.removeAllRanges();
                                    selection.addRange(newRange);
                                } else if (checkboxContainer.previousSibling) {
                                    // Place cursor after previous sibling
                                    const newRange = document.createRange();
                                    const prev = checkboxContainer.previousSibling;
                                    if (prev.nodeType === Node.TEXT_NODE) {
                                        newRange.setStart(prev, prev.textContent.length);
                                    } else if (prev.nodeType === Node.ELEMENT_NODE && prev.tagName === 'BR') {
                                        newRange.setStartAfter(prev);
                                    } else {
                                        newRange.setStartAfter(prev);
                                    }
                                    newRange.collapse(true);
                                    selection.removeAllRanges();
                                    selection.addRange(newRange);
                                } else {
                                    // No siblings, create a br and place cursor there
                                    const br = document.createElement('br');
                                    checkboxContainer.parentNode.insertBefore(br, checkboxContainer);
                                    const newRange = document.createRange();
                                    newRange.setStartBefore(br);
                                    newRange.collapse(true);
                                    selection.removeAllRanges();
                                    selection.addRange(newRange);
                                }
                                
                                // Remove the checkbox container
                                checkboxContainer.remove();
                                
                                // Trigger input event to save
                                const inputEvent = new Event('input', { bubbles: true });
                                this.textarea.dispatchEvent(inputEvent);
                            }
                        }
                    }
                }
            }
        });

        // Track mouse dragging to prevent interfering with selection
        let mouseDown = false;
        this.textarea.addEventListener('mousedown', () => {
            mouseDown = true;
            this.isDragging = false;
        });
        
        this.textarea.addEventListener('mousemove', () => {
            if (mouseDown) {
                this.isDragging = true;
            }
        });
        
        this.textarea.addEventListener('mouseup', () => {
            mouseDown = false;
            // Reset dragging flag after a short delay
            setTimeout(() => {
                this.isDragging = false;
            }, 100);
        });

        // Handle clicks on checkbox lines to place cursor in label
        this.textarea.addEventListener('click', (e) => {
            // Don't interfere if user was dragging (selecting text)
            if (this.isDragging) {
                return;
            }
            
            const target = e.target;
            
            // Check if click is on checkbox container or its children
            let checkboxContainer = null;
            let clickedElement = target;
            
            // Walk up the DOM tree to find checkbox container
            while (clickedElement && clickedElement !== this.textarea) {
                if (clickedElement.nodeType === Node.ELEMENT_NODE) {
                    const element = clickedElement;
                    // Check if this is a checkbox container
                    if (element.style.display === 'flex' && 
                        element.querySelector('input[type="checkbox"]')) {
                        checkboxContainer = element;
                        break;
                    }
                }
                clickedElement = clickedElement.parentNode;
            }
            
            // If clicked on checkbox container (but not the checkbox input itself)
            if (checkboxContainer && target !== checkboxContainer.querySelector('input[type="checkbox"]')) {
                // Small delay to let default click behavior happen first, then move cursor
                setTimeout(() => {
                    const selection = window.getSelection();
                    
                    // Don't interfere if user is selecting text
                    if (selection.rangeCount > 0) {
                        const range = selection.getRangeAt(0);
                        // If there's a non-collapsed selection (user is selecting), don't move cursor
                        if (!range.collapsed) {
                            return;
                        }
                    }
                    
                    const label = checkboxContainer.querySelector('span');
                    if (label) {
                        const range = document.createRange();
                        
                        // Find or create a text node in the label
                        let textNode = null;
                        for (let node of label.childNodes) {
                            if (node.nodeType === Node.TEXT_NODE) {
                                textNode = node;
                                break;
                            }
                        }
                        
                        // If no text node exists, create one
                        if (!textNode) {
                            textNode = document.createTextNode('');
                            label.appendChild(textNode);
                        }
                        
                        // Place cursor at the end of the label text
                        range.setStart(textNode, textNode.textContent.length);
                        range.setEnd(textNode, textNode.textContent.length);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }, 0);
            }
        });

        // Search functionality
        if (this.emojiSearch) {
            this.emojiSearch.addEventListener('input', (e) => {
                this.filterEmojis(e.target.value);
            });
        }

        // Remove button functionality
        if (this.emojiRemove) {
            this.emojiRemove.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeEmojiButton();
            });
        }

        if (this.emojiAddButton) {
            this.emojiAddButton.addEventListener('click', () => {
                this.restoreEmojiButton();
            });
        }

        // Listen for text selection
        this.textarea.addEventListener('mouseup', () => this.checkSelection());
        this.textarea.addEventListener('keyup', () => this.checkSelection());
        document.addEventListener('selectionchange', () => this.checkSelection());
    }

    checkSelection() {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            this.hideFormatMenu();
            this.savedSelection = null;
            return;
        }

        const range = selection.getRangeAt(0);
        if (!range || range.collapsed) {
            this.hideFormatMenu();
            this.savedSelection = null;
            return;
        }

        // Check if selection is within our textarea
        if (!this.textarea.contains(range.commonAncestorContainer)) {
            this.hideFormatMenu();
            this.savedSelection = null;
            return;
        }

        // Save selection info for later use
        const textareaText = this.textarea.textContent || this.textarea.innerText;
        const selectedText = range.toString();
        const startOffset = this.getTextOffset(this.textarea, range.startContainer, range.startOffset);
        const endOffset = startOffset + selectedText.length;
        
        console.log('Saving selection:', { startOffset, endOffset, selectedText, textareaLength: textareaText.length });
        
        this.savedSelection = {
            startOffset,
            endOffset,
            selectedText
        };

        // Show format menu near selection
        this.showFormatMenu(range);
    }

    getTextOffset(rootNode, targetNode, targetOffset) {
        let offset = 0;
        const walker = document.createTreeWalker(
            rootNode,
            NodeFilter.SHOW_TEXT,
            null
        );

        let node;
        while (node = walker.nextNode()) {
            if (node === targetNode) {
                return offset + targetOffset;
            }
            offset += node.textContent.length;
        }
        return offset;
    }

    showFormatMenu(range) {
        const rect = range.getBoundingClientRect();
        const menuHeight = 300; // Approximate menu height
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        
        // Position above if not enough space below, but enough space above
        if (spaceBelow < menuHeight && spaceAbove > menuHeight) {
            this.formatMenu.style.top = `${rect.top - menuHeight - 10}px`;
        } else {
            this.formatMenu.style.top = `${rect.bottom + 10}px`;
        }
        
        this.formatMenu.style.left = `${rect.left + rect.width / 2}px`;
        this.formatMenu.style.transform = 'translateX(-50%)';
        
        this.renderFormatMenu();
        this.formatMenu.classList.remove('hidden');
    }

    hideFormatMenu() {
        this.formatMenu.classList.add('hidden');
    }

    renderFormatMenu() {
        this.formatMenuItems.innerHTML = '';
        this.formatTypes.forEach((type) => {
            const item = document.createElement('div');
            item.className = 'flex items-center gap-3 px-3 py-2 hover:bg-gray-700 rounded cursor-pointer text-white';
            item.innerHTML = `
                <span class="text-gray-400 w-6 text-center">${type.icon}</span>
                <span class="flex-1">${type.label}</span>
                ${type.shortcut ? `<span class="text-xs text-gray-500">${type.shortcut}</span>` : ''}
            `;
            item.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Don't let mousedown clear the selection
            });
            item.addEventListener('mouseup', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Format clicked:', type.type);
                console.log('Saved selection:', this.savedSelection);
                if (this.savedSelection) {
                    this.applyFormat(type.type);
                } else {
                    console.error('No saved selection available!');
                }
                this.hideFormatMenu();
            });
            this.formatMenuItems.appendChild(item);
        });
    }

    applyFormat(formatType) {
        if (!this.savedSelection) {
            console.error('No saved selection!');
            return;
        }

        const { startOffset, endOffset, selectedText } = this.savedSelection;
        console.log('Formatting:', selectedText, 'at', startOffset, '-', endOffset);
        
        if (!selectedText || selectedText.trim() === '') {
            console.error('No text selected!');
            return;
        }
        
        // Get current text content
        const currentText = this.textarea.textContent || '';
        
        // Verify the text at the offsets matches what we expect
        const textAtOffset = currentText.substring(startOffset, endOffset);
        console.log('Text at offset:', textAtOffset, 'Expected:', selectedText);
        
        // If offsets don't match, try to find the text
        let actualStart = startOffset;
        let actualEnd = endOffset;
        
        if (textAtOffset !== selectedText) {
            // Try to find the selected text in the current content
            const foundIndex = currentText.indexOf(selectedText);
            if (foundIndex !== -1) {
                actualStart = foundIndex;
                actualEnd = foundIndex + selectedText.length;
                console.log('Found text at different position:', actualStart, '-', actualEnd);
            } else {
                console.error('Selected text not found in content!');
                return;
            }
        }
        
        // Get the range for the selected text
        const range = document.createRange();
        const walker = document.createTreeWalker(
            this.textarea,
            NodeFilter.SHOW_TEXT,
            null
        );

        let node;
        let currentOffset = 0;
        let startNode = null, startNodeOffset = 0;
        let endNode = null, endNodeOffset = 0;

        while (node = walker.nextNode()) {
            const nodeLength = node.textContent.length;
            
            if (!startNode && currentOffset + nodeLength >= actualStart) {
                startNode = node;
                startNodeOffset = actualStart - currentOffset;
            }
            
            if (currentOffset + nodeLength >= actualEnd) {
                endNode = node;
                endNodeOffset = actualEnd - currentOffset;
                break;
            }
            
            currentOffset += nodeLength;
        }

        if (!startNode || !endNode) {
            console.error('Could not find nodes for selection');
            return;
        }

        try {
            range.setStart(startNode, startNodeOffset);
            range.setEnd(endNode, endNodeOffset);
        } catch (e) {
            console.error('Error setting range:', e);
            return;
        }

        // Apply formatting based on type
        switch (formatType) {
            case 'h1':
                const h1 = document.createElement('h1');
                h1.style.fontSize = '2em';
                h1.style.fontWeight = 'bold';
                h1.style.margin = '0.5em 0';
                h1.textContent = selectedText;
                range.deleteContents();
                range.insertNode(h1);
                break;
            case 'h2':
                const h2 = document.createElement('h2');
                h2.style.fontSize = '1.5em';
                h2.style.fontWeight = 'bold';
                h2.style.margin = '0.5em 0';
                h2.textContent = selectedText;
                range.deleteContents();
                range.insertNode(h2);
                break;
            case 'h3':
                const h3 = document.createElement('h3');
                h3.style.fontSize = '1.25em';
                h3.style.fontWeight = 'bold';
                h3.style.margin = '0.5em 0';
                h3.textContent = selectedText;
                range.deleteContents();
                range.insertNode(h3);
                break;
            case 'bullet':
                const lines = selectedText.split('\n').filter(line => line.trim());
                range.deleteContents();
                lines.forEach((line, i) => {
                    const li = document.createElement('div');
                    li.style.marginLeft = '1.5em';
                    li.textContent = '• ' + line.trim();
                    if (i === 0) {
                        range.insertNode(li);
                    } else {
                        range.collapse(false);
                        range.insertNode(li);
                    }
                });
                break;
            case 'number':
                const numLines = selectedText.split('\n').filter(line => line.trim());
                range.deleteContents();
                numLines.forEach((line, i) => {
                    const li = document.createElement('div');
                    li.style.marginLeft = '1.5em';
                    li.textContent = `${i + 1}. ${line.trim()}`;
                    if (i === 0) {
                        range.insertNode(li);
                    } else {
                        range.collapse(false);
                        range.insertNode(li);
                    }
                });
                break;
            case 'checkbox':
                const checkLines = selectedText.split('\n').filter(line => line.trim());
                range.deleteContents();
                checkLines.forEach((line, i) => {
                    const container = document.createElement('div');
                    container.style.display = 'flex';
                    container.style.alignItems = 'center';
                    container.style.gap = '0.5em';
                    container.style.margin = '0.25em 0';
                    
                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.style.cursor = 'pointer';
                    
                    const label = document.createElement('span');
                    label.textContent = line.trim();
                    
                    // Add event listener to toggle strike-through
                    checkbox.addEventListener('change', () => {
                        if (checkbox.checked) {
                            label.style.textDecoration = 'line-through';
                            label.style.opacity = '0.6';
                        } else {
                            label.style.textDecoration = 'none';
                            label.style.opacity = '1';
                        }
                    });
                    
                    container.appendChild(checkbox);
                    container.appendChild(label);
                    
                    if (i === 0) {
                        range.insertNode(container);
                    } else {
                        range.collapse(false);
                        range.insertNode(container);
                    }
                });
                break;
            case 'bold':
                const strong = document.createElement('strong');
                strong.textContent = selectedText;
                strong.style.fontWeight = 'bold';
                range.deleteContents();
                range.insertNode(strong);
                break;
            case 'italic':
                const em = document.createElement('em');
                em.textContent = selectedText;
                em.style.fontStyle = 'italic';
                range.deleteContents();
                range.insertNode(em);
                break;
            default:
                // No formatting
                break;
        }

        // Clear selection
        const selection = window.getSelection();
        selection.removeAllRanges();
        
        // Move cursor to end of inserted content
        range.collapse(false);
        selection.addRange(range);

        // Clear saved selection
        this.savedSelection = null;

        // Trigger input event to save
        const inputEvent = new Event('input', { bubbles: true });
        this.textarea.dispatchEvent(inputEvent);
        
        console.log('Format applied successfully');
    }

    restoreCheckboxStates() {
        // Find all checkboxes and restore their strike-through styling
        const checkboxes = this.textarea.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            const label = checkbox.nextElementSibling;
            if (label && label.tagName === 'SPAN') {
                if (checkbox.checked) {
                    label.style.textDecoration = 'line-through';
                    label.style.opacity = '0.6';
                } else {
                    label.style.textDecoration = 'none';
                    label.style.opacity = '1';
                }
                
                // Re-attach event listener in case it was lost
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        label.style.textDecoration = 'line-through';
                        label.style.opacity = '0.6';
                    } else {
                        label.style.textDecoration = 'none';
                        label.style.opacity = '1';
                    }
                });
            }
        });
    }

    setCursorPosition(position) {
        const selection = window.getSelection();
        const range = document.createRange();
        
        let currentOffset = 0;
        const walker = document.createTreeWalker(
            this.textarea,
            NodeFilter.SHOW_TEXT,
            null
        );

        let node;
        while (node = walker.nextNode()) {
            const nodeLength = node.textContent.length;
            
            if (currentOffset + nodeLength >= position) {
                const offset = position - currentOffset;
                range.setStart(node, offset);
                range.setEnd(node, offset);
                selection.removeAllRanges();
                selection.addRange(range);
                return;
            }
            
            currentOffset += nodeLength;
        }
        
        // If position is beyond all text, set at end
        const lastNode = this.textarea.lastChild;
        if (lastNode && lastNode.nodeType === Node.TEXT_NODE) {
            range.setStart(lastNode, lastNode.textContent.length);
            range.setEnd(lastNode, lastNode.textContent.length);
        } else {
            range.setStart(this.textarea, this.textarea.childNodes.length);
            range.setEnd(this.textarea, this.textarea.childNodes.length);
        }
        selection.removeAllRanges();
        selection.addRange(range);
    }

    loadState() {
        const savedTitle = localStorage.getItem('notesTitle');
        if (savedTitle) {
            this.titleEl.innerText = savedTitle;
        }

        const savedContent = localStorage.getItem('notesContent');
        if (savedContent) {
            this.textarea.innerHTML = savedContent;
            // Restore checkbox states and strike-through styling
            this.restoreCheckboxStates();
        }

        const savedEmoji = localStorage.getItem('notesEmoji');
        if (savedEmoji && this.emojiButton) {
            this.emojiButton.textContent = savedEmoji;
        }

        // Load emoji button visibility state
        const emojiButtonHidden = localStorage.getItem('emojiButtonHidden');
        if (emojiButtonHidden === 'true') {
            this.hideEmojiButton();
        } else {
            this.showEmojiButton();
        }
    }

    attachGlobalListeners() {
        document.addEventListener('click', (e) => {
            if (!this.emojiMenu.contains(e.target) && e.target !== this.emojiButton) {
                this.hideEmojiMenu();
            }
            // Only hide format menu if clicking outside both the menu and textarea
            const clickedOnFormatMenu = this.formatMenu.contains(e.target);
            const clickedOnTextarea = this.textarea.contains(e.target);
            if (!clickedOnFormatMenu && !clickedOnTextarea) {
                this.hideFormatMenu();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideEmojiMenu();
                this.hideFormatMenu();
            }
        });

        this.emojiButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleEmojiMenu();
        });

        this.renderEmojiOptions();
    }

    renderEmojiOptions(filter = '') {
        this.emojiOptions.innerHTML = '';
        const filtered = filter ? this.emojiChoices.filter(emoji => 
            emoji.includes(filter) || this.getEmojiName(emoji).toLowerCase().includes(filter.toLowerCase())
        ) : this.emojiChoices;
        
        filtered.forEach(emoji => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.textContent = emoji;
            btn.title = this.getEmojiName(emoji);
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.insertEmoji(emoji);
                this.hideEmojiMenu();
            });
            this.emojiOptions.appendChild(btn);
        });
    }

    filterEmojis(searchTerm) {
        this.renderEmojiOptions(searchTerm);
    }

    getEmojiName(emoji) {
        // Emoji name mapping for study app icons
        const names = {
            '🌙': 'moon',
            '☀️': 'sun',
            '⭐': 'star',
            '🌟': 'glowing star',
            '🦉': 'owl',
            '🥷': 'ninja',
            '🦑': 'squid',
            '🐸': 'frog',
            '🌿': 'herb',
            '🌱': 'seedling',
            '🌻': 'sunflower',
            '🍀': 'four leaf clover',
            '🌵': 'cactus',
            '🌈': 'rainbow',
            '🌪️': 'tornado',
            '☁️': 'cloud',
            '🌤️': 'sun behind small cloud',
            '💰': 'money bag',
            '💸': 'money with wings',
            '💡': 'light bulb'
        };
        return names[emoji] || emoji;
    }

    removeEmojiButton() {
        this.hideEmojiButton();
        localStorage.setItem('emojiButtonHidden', 'true');
        this.hideEmojiMenu();
    }

    hideEmojiButton() {
        if (this.emojiButton) {
            this.emojiButton.classList.add('hidden');
        }
        if (this.emojiAddButton) {
            this.emojiAddButton.classList.remove('hidden');
        }
    }

    showEmojiButton() {
        if (this.emojiButton) {
            this.emojiButton.classList.remove('hidden');
        }
        if (this.emojiAddButton) {
            this.emojiAddButton.classList.add('hidden');
        }
        localStorage.setItem('emojiButtonHidden', 'false');
    }

    restoreEmojiButton() {
        this.showEmojiButton();
    }

    toggleEmojiMenu() {
        if (this.emojiMenu.classList.contains('hidden')) {
            const rect = this.emojiButton.getBoundingClientRect();
            this.emojiMenu.style.top = `${rect.bottom + 8}px`;
            this.emojiMenu.style.left = `${rect.left}px`;
            if (this.emojiSearch) {
                this.emojiSearch.value = '';
            }
            this.renderEmojiOptions();
            this.emojiMenu.classList.remove('hidden');
            if (this.emojiSearch) {
                setTimeout(() => this.emojiSearch.focus(), 50);
            }
        } else {
            this.hideEmojiMenu();
        }
    }

    hideEmojiMenu() {
        this.emojiMenu.classList.add('hidden');
    }

    insertEmoji(emoji) {
        if (!this.emojiButton) return;
        this.emojiButton.textContent = emoji;
        this.emojiButton.setAttribute('aria-label', `Current emoji ${emoji}`);
        localStorage.setItem('notesEmoji', emoji);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.notesEditor = new SimpleNotesEditor();
    
    // Setup resize functionality for notes sidebar
    const notesContainer = document.getElementById('notes-container');
    const resizeHandle = document.getElementById('resize-handle-left');
    
    if (resizeHandle && notesContainer) {
        let isResizing = false;
        let startX = 0;
        let startWidth = 0;
        
        resizeHandle.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startWidth = notesContainer.offsetWidth;
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const diff = startX - e.clientX; // Inverted because we're resizing from left
            const newWidth = startWidth + diff;
            const minWidth = 200;
            const maxWidth = window.innerWidth * 0.8;
            
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                notesContainer.style.width = newWidth + 'px';
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                // Save width to localStorage
                localStorage.setItem('notesWidth', notesContainer.style.width);
            }
        });
        
        // Load saved width
        const savedWidth = localStorage.getItem('notesWidth');
        if (savedWidth) {
            notesContainer.style.width = savedWidth;
        }
    }
});
