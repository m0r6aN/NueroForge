// __tests__/components/learning/PatternRecognitionChallenge.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PatternRecognitionChallenge from '@/components/learning/PatternRecognitionChallenge';

// Mock the toasts
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

describe('PatternRecognitionChallenge Component', () => {
  // Test data
  const mockProps = {
    lessonId: 'lesson123',
    patternType: 'sequence',
    difficulty: 3,
    examples: [
      { input: [1, 2, 3], output: 4 },
      { input: [2, 4, 6], output: 8 }
    ],
    testCases: [
      { 
        input: [3, 6, 9], 
        output: 12, 
        explanation: 'The pattern adds 3 each time' 
      },
      { 
        input: [5, 10, 15], 
        output: 20, 
        explanation: 'The pattern adds 5 each time' 
      }
    ],
    timeLimit: 120,
    hints: ['Look for arithmetic sequences', 'Find the common difference'],
    onComplete: jest.fn(),
    onProgressUpdate: jest.fn()
  };

  it('renders correctly with all props', () => {
    render(<PatternRecognitionChallenge {...mockProps} />);
    
    // Check header content
    expect(screen.getByText('Pattern Recognition Training')).toBeInTheDocument();
    expect(screen.getByText('Level 3')).toBeInTheDocument();
    
    // Check for examples
    expect(screen.getByText('Pattern Examples:')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    
    // Check for test case
    expect(screen.getByText('Test Case 1/2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // Check for input field
    expect(screen.getByPlaceholderText('Enter the next item in the pattern')).toBeInTheDocument();
  });

  it('handles user input and submission correctly', async () => {
    render(<PatternRecognitionChallenge {...mockProps} />);
    
    const input = screen.getByPlaceholderText('Enter the next item in the pattern');
    const submitButton = screen.getByRole('button', { name: /send/i });
    
    // Button should be disabled initially (empty input)
    expect(submitButton).toBeDisabled();
    
    // Enter correct answer and submit
    fireEvent.change(input, { target: { value: '12' } });
    expect(submitButton).not.toBeDisabled();
    fireEvent.click(submitButton);
    
    // Should show success message and advance to next test
    await waitFor(() => {
      expect(screen.getByText('Correct!')).toBeInTheDocument();
      expect(screen.getByText('Great job! Moving to the next pattern...')).toBeInTheDocument();
    });
    
    // Should move to next test case after delay
    await waitFor(() => {
      expect(screen.getByText('Test Case 2/2')).toBeInTheDocument();
    }, { timeout: 2500 });
  });

  it('handles incorrect answers appropriately', async () => {
    render(<PatternRecognitionChallenge {...mockProps} />);
    
    const input = screen.getByPlaceholderText('Enter the next item in the pattern');
    const submitButton = screen.getByRole('button', { name: /send/i });
    
    // Enter wrong answer and submit
    fireEvent.change(input, { target: { value: '11' } });
    fireEvent.click(submitButton);
    
    // Should show error message with explanation
    await waitFor(() => {
      expect(screen.getByText('Incorrect')).toBeInTheDocument();
      expect(screen.getByText('The correct answer is: 12')).toBeInTheDocument();
      expect(screen.getByText('The pattern adds 3 each time')).toBeInTheDocument();
    });
  });

  it('supports revealing hints', async () => {
    render(<PatternRecognitionChallenge {...mockProps} />);
    
    // Initially, no hints should be shown
    expect(screen.getByText('Reveal a Hint')).toBeInTheDocument();
    
    // Click to reveal hint
    fireEvent.click(screen.getByText('Reveal a Hint'));
    
    // First hint should now be visible
    await waitFor(() => {
      expect(screen.getByText('Look for arithmetic sequences')).toBeInTheDocument();
      expect(screen.getByText('Reveal Next Hint')).toBeInTheDocument();
    });
    
    // Click to reveal next hint
    fireEvent.click(screen.getByText('Reveal Next Hint'));
    
    // Second hint should now be visible
    await waitFor(() => {
      expect(screen.getByText('Find the common difference')).toBeInTheDocument();
      // No more "Reveal Next Hint" button since we used all hints
      expect(screen.queryByText('Reveal Next Hint')).not.toBeInTheDocument();
    });
  });

  it('completes challenge when all test cases are solved', async () => {
    render(<PatternRecognitionChallenge {...mockProps} />);
    
    // Solve first test case
    const input = screen.getByPlaceholderText('Enter the next item in the pattern');
    fireEvent.change(input, { target: { value: '12' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    // Wait for transition to next test case
    await waitFor(() => {
      expect(screen.getByText('Test Case 2/2')).toBeInTheDocument();
    }, { timeout: 2500 });
    
    // Solve second test case
    fireEvent.change(input, { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: /send/i }));
    
    // Should trigger completion
    await waitFor(() => {
      expect(mockProps.onComplete).toHaveBeenCalledWith(true, expect.any(Number), expect.any(Number));
    });
    
    // Should show completion summary
    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('Patterns Solved:')).toBeInTheDocument();
      expect(screen.getByText('2/2')).toBeInTheDocument();
    });
  });

  it('handles time limit correctly', async () => {
    jest.useFakeTimers();
    
    render(<PatternRecognitionChallenge {...mockProps} />);
    
    // Initial time should be displayed
    expect(screen.getByText('02:00')).toBeInTheDocument();
    
    // Advance time
    jest.advanceTimersByTime(10000); // 10 seconds
    
    // Time should update
    expect(screen.getByText('01:50')).toBeInTheDocument();
    
    // Advance to end of time
    jest.advanceTimersByTime(110000); // Another 110 seconds
    
    // Challenge should auto-complete when time is up
    await waitFor(() => {
      expect(mockProps.onComplete).toHaveBeenCalled();
    });
    
    jest.useRealTimers();
  });

  // Edge cases
  it('handles zero time limit correctly', () => {
    const propsWithNoTimeLimit = {
      ...mockProps,
      timeLimit: 0
    };
    
    render(<PatternRecognitionChallenge {...propsWithNoTimeLimit} />);
    
    // No timer should be visible
    expect(screen.queryByText(/\d\d:\d\d/)).not.toBeInTheDocument();
  });

  it('handles empty hints array', () => {
    const propsWithNoHints = {
      ...mockProps,
      hints: []
    };
    
    render(<PatternRecognitionChallenge {...propsWithNoHints} />);
    
    // No hints section should be visible
    expect(screen.queryByText('Neural Assistance')).not.toBeInTheDocument();
    expect(screen.queryByText('Reveal a Hint')).not.toBeInTheDocument();
  });

  it('allows showing the answer after multiple failed attempts', async () => {
    render(<PatternRecognitionChallenge {...mockProps} />);
    
    const input = screen.getByPlaceholderText('Enter the next item in the pattern');
    const submitButton = screen.getByRole('button', { name: /send/i });
    
    // Submit wrong answer 3 times
    for (let i = 0; i < 3; i++) {
      fireEvent.change(input, { target: { value: `wrong${i}` } });
      fireEvent.click(submitButton);
      
      // Wait for animation to complete
      await waitFor(() => {
        expect(screen.getByText('Incorrect')).toBeInTheDocument();
      });
    }
    
    // "Show Answer" button should appear after 3 attempts
    expect(screen.getByText('Show Answer')).toBeInTheDocument();
    
    // Click "Show Answer"
    fireEvent.click(screen.getByText('Show Answer'));
    
    // Input should be filled with correct answer
    expect(input.value).toBe('12');
  });
});