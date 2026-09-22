# tray-micro-todo Specification

## Purpose
Provides a lightning-fast, zero-overhead task management and focus experience directly within the macOS system tray popup window without requiring a full desktop dashboard.

## Requirements

### Requirement: Quick-add task from tray input
The system SHALL allow users to type a task title into an inline text input and submit it with the Enter key.
The system SHALL insert the new task at the top of the waiting (TODO) task list.
The system SHALL NOT require priority, category, deadline, or notes to create a task.

#### Scenario: Successfully add task to top of list
- **WHEN** the user types "새로운 할 일" in the tray input field and presses Enter
- **THEN** a new task with title "새로운 할 일" is created and appears at the top of the TODO list, and the input field is cleared.

#### Scenario: Ignore empty task input
- **WHEN** the user presses Enter on an empty or whitespace-only input field
- **THEN** no task is created and the input retains its state without errors.

### Requirement: Zero priority overhead
The system SHALL NOT display priority selectors, priority labels, or priority badges in the tray task interface.
The system SHALL maintain task order solely through their linear position in the list.

#### Scenario: Task item rendering without priority
- **WHEN** the user views the task list in the tray window
- **THEN** tasks are displayed showing title and action buttons without any priority indicator.

### Requirement: Single focus task management (NOW slot)
The system SHALL support designating at most one task as the active focus (NOW) item.
The system SHALL display the active NOW task with its elapsed focus time and provide completion and pause controls.

#### Scenario: Start task from TODO list
- **WHEN** the user clicks the "시작" button on a task in the TODO list
- **THEN** that task becomes the active NOW task, its timer begins running, and any previous focus item is paused.

#### Scenario: Pause current focus task
- **WHEN** the user clicks "일시정지" on the active NOW task
- **THEN** the task returns to the TODO list and the NOW section displays an idle state.

### Requirement: Done feedback with strikethrough
The system SHALL mark a task as completed when the user clicks its completion checkbox or button.
The system SHALL apply a visual strikethrough to the completed task title and display it in a compact DONE section.

#### Scenario: Complete active or waiting task
- **WHEN** the user clicks the completion action for a task
- **THEN** the task status transitions to completed, its title is rendered with a strikethrough style, and it appears in the DONE section.

### Requirement: Restore completed task to TODO
The system SHALL allow users to uncheck a completed task to return it to the waiting (TODO) list.
The system SHALL remove the strikethrough styling upon restoration and render the task in the TODO section without altering the active NOW slot.

#### Scenario: Restore completed task
- **WHEN** the user clicks the completion checkmark on an item in the DONE section
- **THEN** the task status transitions to 'todo', its title is rendered without strikethrough in the TODO list, and the active NOW slot remains unaffected.

### Requirement: Standalone tray window operation
The system SHALL operate as a menu-bar accessory service where the tray window is the primary interface and does not require opening a main desktop window.

#### Scenario: Dismiss tray window on blur or escape
- **WHEN** the user clicks outside the tray window or presses the Escape key
- **THEN** the tray window is hidden immediately.
