export interface Problem {
  id: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  category: string
  tags: string[]
  description: string
  examples: { input: string; output: string; explanation?: string }[]
  constraints: string[]
  starterCode: { python: string; javascript: string; java?: string }
  testCases: { input: string; expected: string; isHidden?: boolean }[]
  hints: string[]
}

export const CATEGORIES = [
  'Arrays',
  'Strings',
  'Hashing',
  'Stack',
  'Two Pointers',
  'Sliding Window',
  'Binary Search',
  'Recursion',
  'Dynamic Programming',
  'Graphs',
  'Trees',
  'Heap',
  'Backtracking',
  'Bit Manipulation',
  'Math',
  'Design',
  'Sorting',
  'Linked List',
]

export const DIFFICULTY_LABELS: Record<Problem['difficulty'], string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
}

export const PROBLEMS: Problem[] = [
  // ─── EASY (15) ────────────────────────────────────────────────────────────

  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'easy',
    category: 'Arrays',
    tags: ['arrays', 'hashing'],
    description:
      'Given an array of integers `nums` and an integer `target`, return the indices of the two numbers that add up to `target`. You may assume that each input has exactly one solution, and you may not use the same element twice. Return the answer in any order.',
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'nums[0] + nums[1] == 2 + 7 == 9, so we return [0, 1].',
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
      },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    starterCode: {
      python: `def solution(nums: list[int], target: int) -> list[int]:
    # Write your solution here
    pass`,
      javascript: `function solution(nums, target) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[2,7,11,15]\n9', expected: '[0,1]' },
      { input: '[3,2,4]\n6', expected: '[1,2]' },
      { input: '[3,3]\n6', expected: '[0,1]' },
      { input: '[1,2,3,4,5]\n9', expected: '[3,4]', isHidden: true },
      { input: '[-1,-2,-3,-4,-5]\n-8', expected: '[2,4]', isHidden: true },
    ],
    hints: [
      'Use a hash map to store each number and its index as you iterate.',
      'For each number, check if (target - number) already exists in the map.',
      'This gives you an O(n) solution instead of the brute force O(n²).',
    ],
  },

  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'easy',
    category: 'Stack',
    tags: ['stack', 'strings'],
    description:
      'Given a string `s` containing just the characters `(`, `)`, `{`, `}`, `[` and `]`, determine if the input string is valid. A string is valid if open brackets are closed by the same type of brackets in the correct order, and every close bracket has a corresponding open bracket.',
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false', explanation: 'The brackets are not closed in the correct order.' },
    ],
    constraints: ['1 <= s.length <= 10^4', 's consists of parentheses only "()[]{}"'],
    starterCode: {
      python: `def solution(s: str) -> bool:
    # Write your solution here
    pass`,
      javascript: `function solution(s) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '()', expected: 'true' },
      { input: '()[{}]', expected: 'true' },
      { input: '(]', expected: 'false' },
      { input: '([)]', expected: 'false', isHidden: true },
      { input: '{[]}', expected: 'true', isHidden: true },
    ],
    hints: [
      'Use a stack: push open brackets and pop when you see a closing bracket.',
      'Check that each closing bracket matches the top of the stack.',
      'At the end, the stack should be empty for a valid string.',
    ],
  },

  {
    id: 'reverse-string',
    title: 'Reverse String',
    difficulty: 'easy',
    category: 'Strings',
    tags: ['strings', 'two pointers'],
    description:
      'Write a function that reverses a string. The input is given as an array of characters `s`. You must do this by modifying the input array in-place with O(1) extra memory. Return the reversed array.',
    examples: [
      { input: 's = ["h","e","l","l","o"]', output: '["o","l","l","e","h"]' },
      { input: 's = ["H","a","n","n","a","h"]', output: '["h","a","n","n","a","H"]' },
    ],
    constraints: ['1 <= s.length <= 10^5', 's[i] is a printable ASCII character.'],
    starterCode: {
      python: `def solution(s: list[str]) -> list[str]:
    # Write your solution here
    pass`,
      javascript: `function solution(s) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '["h","e","l","l","o"]', expected: '["o","l","l","e","h"]' },
      { input: '["H","a","n","n","a","h"]', expected: '["h","a","n","n","a","H"]' },
      { input: '["a"]', expected: '["a"]' },
      { input: '["a","b"]', expected: '["b","a"]', isHidden: true },
    ],
    hints: [
      'Use two pointers, one at the start and one at the end.',
      'Swap the characters at the two pointers, then move them toward each other.',
      'Stop when the pointers meet or cross.',
    ],
  },

  {
    id: 'palindrome-check',
    title: 'Valid Palindrome',
    difficulty: 'easy',
    category: 'Strings',
    tags: ['strings', 'two pointers'],
    description:
      'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string `s`, return `true` if it is a palindrome, or `false` otherwise.',
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: 'true',
        explanation: '"amanaplanacanalpanama" is a palindrome.',
      },
      { input: 's = "race a car"', output: 'false', explanation: '"raceacar" is not a palindrome.' },
      { input: 's = " "', output: 'true', explanation: 'An empty string after filtering is a palindrome.' },
    ],
    constraints: ['1 <= s.length <= 2 * 10^5', 's consists only of printable ASCII characters.'],
    starterCode: {
      python: `def solution(s: str) -> bool:
    # Write your solution here
    pass`,
      javascript: `function solution(s) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: 'A man, a plan, a canal: Panama', expected: 'true' },
      { input: 'race a car', expected: 'false' },
      { input: ' ', expected: 'true' },
      { input: 'No lemon, no melon', expected: 'true', isHidden: true },
    ],
    hints: [
      'Filter the string to keep only alphanumeric characters and convert to lowercase.',
      'Then use two pointers from both ends to compare characters.',
      'Alternatively, compare the filtered string to its reverse.',
    ],
  },

  {
    id: 'fizzbuzz',
    title: 'FizzBuzz',
    difficulty: 'easy',
    category: 'Math',
    tags: ['math', 'strings'],
    description:
      'Given an integer `n`, return a string array where: the element is "FizzBuzz" if `i` is divisible by both 3 and 5, "Fizz" if divisible by 3, "Buzz" if divisible by 5, and the string representation of `i` otherwise. The array should contain answers for every integer from 1 to n inclusive.',
    examples: [
      { input: 'n = 3', output: '["1","2","Fizz"]' },
      { input: 'n = 5', output: '["1","2","Fizz","4","Buzz"]' },
      { input: 'n = 15', output: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]' },
    ],
    constraints: ['1 <= n <= 10^4'],
    starterCode: {
      python: `def solution(n: int) -> list[str]:
    # Write your solution here
    pass`,
      javascript: `function solution(n) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '3', expected: '["1","2","Fizz"]' },
      { input: '5', expected: '["1","2","Fizz","4","Buzz"]' },
      { input: '15', expected: '["1","2","Fizz","4","Buzz","Fizz","7","8","Fizz","Buzz","11","Fizz","13","14","FizzBuzz"]' },
      { input: '1', expected: '["1"]', isHidden: true },
    ],
    hints: [
      'Check divisibility by 15 (both 3 and 5) before checking 3 or 5 individually.',
      'Use the modulo operator (%) to check divisibility.',
      'Build the result array in a single pass from 1 to n.',
    ],
  },

  {
    id: 'max-subarray',
    title: 'Maximum Subarray',
    difficulty: 'easy',
    category: 'Dynamic Programming',
    tags: ['arrays', 'dp', 'divide and conquer'],
    description:
      "Given an integer array `nums`, find the contiguous subarray (containing at least one number) that has the largest sum and return its sum. This is solved optimally using Kadane's Algorithm, which runs in O(n) time.",
    examples: [
      {
        input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]',
        output: '6',
        explanation: 'The subarray [4,-1,2,1] has the largest sum = 6.',
      },
      { input: 'nums = [1]', output: '1' },
      { input: 'nums = [5,4,-1,7,8]', output: '23' },
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4'],
    starterCode: {
      python: `def solution(nums: list[int]) -> int:
    # Write your solution here
    pass`,
      javascript: `function solution(nums) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[-2,1,-3,4,-1,2,1,-5,4]', expected: '6' },
      { input: '[1]', expected: '1' },
      { input: '[5,4,-1,7,8]', expected: '23' },
      { input: '[-1,-2,-3,-4]', expected: '-1', isHidden: true },
      { input: '[0,0,0]', expected: '0', isHidden: true },
    ],
    hints: [
      "Kadane's Algorithm: maintain a running sum and reset it to 0 when it goes negative.",
      'Track the maximum sum seen so far across all iterations.',
      'Be careful with arrays of all negative numbers — the result is the largest single element.',
    ],
  },

  {
    id: 'fibonacci',
    title: 'Fibonacci Number',
    difficulty: 'easy',
    category: 'Dynamic Programming',
    tags: ['recursion', 'dp', 'math'],
    description:
      'The Fibonacci numbers form the sequence: F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2) for n > 1. Given `n`, calculate F(n). While a naive recursive solution works, aim for an O(n) time and O(1) space iterative approach.',
    examples: [
      { input: 'n = 2', output: '1', explanation: 'F(2) = F(1) + F(0) = 1 + 0 = 1.' },
      { input: 'n = 3', output: '2', explanation: 'F(3) = F(2) + F(1) = 1 + 1 = 2.' },
      { input: 'n = 4', output: '3', explanation: 'F(4) = F(3) + F(2) = 2 + 1 = 3.' },
    ],
    constraints: ['0 <= n <= 30'],
    starterCode: {
      python: `def solution(n: int) -> int:
    # Write your solution here
    pass`,
      javascript: `function solution(n) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '2', expected: '1' },
      { input: '3', expected: '2' },
      { input: '10', expected: '55' },
      { input: '0', expected: '0', isHidden: true },
      { input: '30', expected: '832040', isHidden: true },
    ],
    hints: [
      'The simple recursive solution has exponential time complexity due to repeated subproblems.',
      'Use memoization or an iterative approach to achieve O(n) time.',
      'For the iterative approach, only two variables are needed at any time.',
    ],
  },

  {
    id: 'binary-search',
    title: 'Binary Search',
    difficulty: 'easy',
    category: 'Binary Search',
    tags: ['arrays', 'binary search'],
    description:
      'Given a sorted array of integers `nums` and an integer `target`, write a function to search for `target` in `nums`. Return the index of `target` if found, otherwise return -1. Your solution must run in O(log n) time.',
    examples: [
      {
        input: 'nums = [-1,0,3,5,9,12], target = 9',
        output: '4',
        explanation: '9 exists at index 4.',
      },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1', explanation: '2 does not exist in nums.' },
    ],
    constraints: ['1 <= nums.length <= 10^4', '-10^4 < nums[i], target < 10^4', 'All the integers in nums are unique.', 'nums is sorted in ascending order.'],
    starterCode: {
      python: `def solution(nums: list[int], target: int) -> int:
    # Write your solution here
    pass`,
      javascript: `function solution(nums, target) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[-1,0,3,5,9,12]\n9', expected: '4' },
      { input: '[-1,0,3,5,9,12]\n2', expected: '-1' },
      { input: '[5]\n5', expected: '0' },
      { input: '[1,2,3,4,5,6,7,8,9,10]\n7', expected: '6', isHidden: true },
    ],
    hints: [
      'Maintain left and right pointers; compute mid = (left + right) // 2.',
      'If nums[mid] < target, search the right half; if nums[mid] > target, search the left half.',
      'Return mid when nums[mid] == target; return -1 when left > right.',
    ],
  },

  {
    id: 'remove-duplicates',
    title: 'Remove Duplicates from Sorted Array',
    difficulty: 'easy',
    category: 'Arrays',
    tags: ['arrays', 'two pointers'],
    description:
      'Given an integer array `nums` sorted in non-decreasing order, remove the duplicates in-place so that each unique element appears only once. Return the number of unique elements `k`. The first `k` elements of `nums` should hold the result; the rest does not matter.',
    examples: [
      {
        input: 'nums = [1,1,2]',
        output: '2',
        explanation: 'Your function should return k = 2, with the first two elements of nums being 1 and 2 respectively.',
      },
      { input: 'nums = [0,0,1,1,1,2,2,3,3,4]', output: '5' },
    ],
    constraints: ['1 <= nums.length <= 3 * 10^4', '-100 <= nums[i] <= 100', 'nums is sorted in non-decreasing order.'],
    starterCode: {
      python: `def solution(nums: list[int]) -> int:
    # Write your solution here
    pass`,
      javascript: `function solution(nums) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[1,1,2]', expected: '2' },
      { input: '[0,0,1,1,1,2,2,3,3,4]', expected: '5' },
      { input: '[1]', expected: '1' },
      { input: '[1,1,1,1,1]', expected: '1', isHidden: true },
    ],
    hints: [
      'Use a slow pointer to track where the next unique element should go.',
      'Use a fast pointer to scan through the array.',
      'When nums[fast] != nums[slow], increment slow and copy nums[fast] to nums[slow].',
    ],
  },

  {
    id: 'anagram-check',
    title: 'Valid Anagram',
    difficulty: 'easy',
    category: 'Strings',
    tags: ['strings', 'hashing', 'sorting'],
    description:
      'Given two strings `s` and `t`, return `true` if `t` is an anagram of `s`, and `false` otherwise. An anagram is a word or phrase formed by rearranging the letters of another, typically using all the original letters exactly once.',
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true' },
      { input: 's = "rat", t = "car"', output: 'false' },
    ],
    constraints: ['1 <= s.length, t.length <= 5 * 10^4', 's and t consist of lowercase English letters.'],
    starterCode: {
      python: `def solution(s: str, t: str) -> bool:
    # Write your solution here
    pass`,
      javascript: `function solution(s, t) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: 'anagram\nnagaram', expected: 'true' },
      { input: 'rat\ncar', expected: 'false' },
      { input: 'a\na', expected: 'true' },
      { input: 'ab\nba', expected: 'true', isHidden: true },
      { input: 'listen\nsilent', expected: 'true', isHidden: true },
    ],
    hints: [
      'If the strings have different lengths, they cannot be anagrams.',
      'Count the frequency of each character in both strings and compare.',
      'Alternatively, sort both strings and check for equality.',
    ],
  },

  {
    id: 'first-nonrepeating',
    title: 'First Non-Repeating Character',
    difficulty: 'easy',
    category: 'Strings',
    tags: ['strings', 'hashing'],
    description:
      'Given a string `s`, find the first non-repeating character and return its index. If no such character exists, return -1. You must solve it in O(n) time using a hash map to count character frequencies.',
    examples: [
      { input: 's = "leetcode"', output: '0', explanation: 'The character "l" appears only once at index 0.' },
      { input: 's = "loveleetcode"', output: '2', explanation: 'The character "v" appears only once at index 2.' },
      { input: 's = "aabb"', output: '-1' },
    ],
    constraints: ['1 <= s.length <= 10^5', 's consists of only lowercase English letters.'],
    starterCode: {
      python: `def solution(s: str) -> int:
    # Write your solution here
    pass`,
      javascript: `function solution(s) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: 'leetcode', expected: '0' },
      { input: 'loveleetcode', expected: '2' },
      { input: 'aabb', expected: '-1' },
      { input: 'z', expected: '0', isHidden: true },
      { input: 'aabbccd', expected: '6', isHidden: true },
    ],
    hints: [
      'First pass: count the frequency of every character using a hash map.',
      'Second pass: iterate through the string and return the index of the first character with frequency 1.',
      'This two-pass approach is O(n) time and O(1) space (at most 26 keys).',
    ],
  },

  {
    id: 'missing-number',
    title: 'Missing Number',
    difficulty: 'easy',
    category: 'Arrays',
    tags: ['arrays', 'math', 'bit manipulation'],
    description:
      'Given an array `nums` containing `n` distinct numbers in the range `[0, n]`, return the only number in the range that is missing from the array. Aim for O(n) time and O(1) extra space.',
    examples: [
      { input: 'nums = [3,0,1]', output: '2', explanation: 'n = 3, the range is [0,3]. The missing number is 2.' },
      { input: 'nums = [0,1]', output: '2' },
      { input: 'nums = [9,6,4,2,3,5,7,0,1]', output: '8' },
    ],
    constraints: ['n == nums.length', '1 <= n <= 10^4', '0 <= nums[i] <= n', 'All the numbers of nums are unique.'],
    starterCode: {
      python: `def solution(nums: list[int]) -> int:
    # Write your solution here
    pass`,
      javascript: `function solution(nums) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[3,0,1]', expected: '2' },
      { input: '[0,1]', expected: '2' },
      { input: '[9,6,4,2,3,5,7,0,1]', expected: '8' },
      { input: '[0]', expected: '1', isHidden: true },
    ],
    hints: [
      'The expected sum of 0..n is n*(n+1)/2. Subtract the actual sum to find the missing number.',
      'Alternatively, XOR all indices 0..n and all values in nums; the result is the missing number.',
      'Both approaches are O(n) time and O(1) space.',
    ],
  },

  {
    id: 'merge-sorted-arrays',
    title: 'Merge Sorted Array',
    difficulty: 'easy',
    category: 'Arrays',
    tags: ['arrays', 'two pointers', 'sorting'],
    description:
      'You are given two integer arrays `nums1` and `nums2`, sorted in non-decreasing order, and two integers `m` and `n` representing the number of elements in `nums1` and `nums2` respectively. Merge `nums2` into `nums1` as one sorted array in-place. `nums1` has a length of `m + n`, with the last `n` elements set to 0.',
    examples: [
      {
        input: 'nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3',
        output: '[1,2,2,3,5,6]',
      },
      { input: 'nums1 = [1], m = 1, nums2 = [], n = 0', output: '[1]' },
      { input: 'nums1 = [0], m = 0, nums2 = [1], n = 1', output: '[1]' },
    ],
    constraints: ['nums1.length == m + n', 'nums2.length == n', '0 <= m, n <= 200', '-10^9 <= nums1[i], nums2[j] <= 10^9'],
    starterCode: {
      python: `def solution(nums1: list[int], m: int, nums2: list[int], n: int) -> list[int]:
    # Write your solution here
    pass`,
      javascript: `function solution(nums1, m, nums2, n) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[1,2,3,0,0,0]\n3\n[2,5,6]\n3', expected: '[1,2,2,3,5,6]' },
      { input: '[1]\n1\n[]\n0', expected: '[1]' },
      { input: '[0]\n0\n[1]\n1', expected: '[1]' },
      { input: '[2,0]\n1\n[1]\n1', expected: '[1,2]', isHidden: true },
    ],
    hints: [
      'Merge from the back to avoid overwriting elements in nums1.',
      'Use three pointers: one at the end of nums1 elements, one at the end of nums2, one at the very end of nums1.',
      'Always place the larger of the two current elements at the current back position.',
    ],
  },

  {
    id: 'single-number',
    title: 'Single Number',
    difficulty: 'easy',
    category: 'Arrays',
    tags: ['arrays', 'bit manipulation'],
    description:
      'Given a non-empty array of integers `nums`, every element appears twice except for one. Find that single element and return it. Your solution must have O(n) runtime complexity and use only O(1) extra space. The XOR trick is the key insight.',
    examples: [
      { input: 'nums = [2,2,1]', output: '1' },
      { input: 'nums = [4,1,2,1,2]', output: '4' },
      { input: 'nums = [1]', output: '1' },
    ],
    constraints: ['1 <= nums.length <= 3 * 10^4', '-3 * 10^4 <= nums[i] <= 3 * 10^4', 'Each element in the array appears twice except for one element which appears only once.'],
    starterCode: {
      python: `def solution(nums: list[int]) -> int:
    # Write your solution here
    pass`,
      javascript: `function solution(nums) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[2,2,1]', expected: '1' },
      { input: '[4,1,2,1,2]', expected: '4' },
      { input: '[1]', expected: '1' },
      { input: '[0,1,0]', expected: '1', isHidden: true },
    ],
    hints: [
      'XOR of a number with itself is 0; XOR of a number with 0 is the number itself.',
      'XOR all numbers together — pairs cancel out, leaving only the single number.',
      'This is a one-liner: reduce the array with XOR.',
    ],
  },

  {
    id: 'climbing-stairs',
    title: 'Climbing Stairs',
    difficulty: 'easy',
    category: 'Dynamic Programming',
    tags: ['dp', 'math', 'recursion'],
    description:
      'You are climbing a staircase with `n` steps. Each time you can climb 1 or 2 steps. In how many distinct ways can you climb to the top? The number of ways to reach step `n` equals the sum of ways to reach step `n-1` and step `n-2`, which mirrors the Fibonacci sequence.',
    examples: [
      { input: 'n = 2', output: '2', explanation: 'Two ways: (1+1) and (2).' },
      { input: 'n = 3', output: '3', explanation: 'Three ways: (1+1+1), (1+2), and (2+1).' },
    ],
    constraints: ['1 <= n <= 45'],
    starterCode: {
      python: `def solution(n: int) -> int:
    # Write your solution here
    pass`,
      javascript: `function solution(n) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '2', expected: '2' },
      { input: '3', expected: '3' },
      { input: '10', expected: '89' },
      { input: '1', expected: '1', isHidden: true },
      { input: '45', expected: '1836311903', isHidden: true },
    ],
    hints: [
      'Define dp[i] = number of ways to reach step i.',
      'dp[i] = dp[i-1] + dp[i-2], with base cases dp[1]=1 and dp[2]=2.',
      'You only need the last two values, so O(1) space is achievable.',
    ],
  },

  // ─── MEDIUM (20) ──────────────────────────────────────────────────────────

  {
    id: 'merge-intervals',
    title: 'Merge Intervals',
    difficulty: 'medium',
    category: 'Arrays',
    tags: ['arrays', 'sorting'],
    description:
      'Given an array of `intervals` where `intervals[i] = [starti, endi]`, merge all overlapping intervals and return an array of the non-overlapping intervals that cover all the intervals in the input.',
    examples: [
      {
        input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]',
        output: '[[1,6],[8,10],[15,18]]',
        explanation: '[1,3] and [2,6] overlap, merge to [1,6].',
      },
      { input: 'intervals = [[1,4],[4,5]]', output: '[[1,5]]' },
    ],
    constraints: ['1 <= intervals.length <= 10^4', 'intervals[i].length == 2', '0 <= starti <= endi <= 10^4'],
    starterCode: {
      python: `def solution(intervals: list[list[int]]) -> list[list[int]]:
    # Write your solution here
    pass`,
      javascript: `function solution(intervals) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[[1,3],[2,6],[8,10],[15,18]]', expected: '[[1,6],[8,10],[15,18]]' },
      { input: '[[1,4],[4,5]]', expected: '[[1,5]]' },
      { input: '[[1,4],[0,4]]', expected: '[[0,4]]' },
      { input: '[[1,4],[2,3]]', expected: '[[1,4]]', isHidden: true },
    ],
    hints: [
      'Sort the intervals by their start time.',
      'Iterate and compare each interval with the last merged interval.',
      'If the current start <= last merged end, extend the end; otherwise append a new interval.',
    ],
  },

  {
    id: 'group-anagrams',
    title: 'Group Anagrams',
    difficulty: 'medium',
    category: 'Hashing',
    tags: ['hashing', 'strings', 'sorting'],
    description:
      'Given an array of strings `strs`, group the anagrams together and return the groups in any order. Two strings are anagrams if one is a rearrangement of the other using the same characters.',
    examples: [
      {
        input: 'strs = ["eat","tea","tan","ate","nat","bat"]',
        output: '[["bat"],["nat","tan"],["ate","eat","tea"]]',
      },
      { input: 'strs = [""]', output: '[[""]]' },
      { input: 'strs = ["a"]', output: '[["a"]]' },
    ],
    constraints: ['1 <= strs.length <= 10^4', '0 <= strs[i].length <= 100', 'strs[i] consists of lowercase English letters.'],
    starterCode: {
      python: `def solution(strs: list[str]) -> list[list[str]]:
    # Write your solution here
    pass`,
      javascript: `function solution(strs) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '["eat","tea","tan","ate","nat","bat"]', expected: '[["eat","tea","ate"],["tan","nat"],["bat"]]' },
      { input: '[""]', expected: '[[""]]' },
      { input: '["a"]', expected: '[["a"]]' },
      { input: '["abc","bca","cab","xyz","zyx"]', expected: '[["abc","bca","cab"],["xyz","zyx"]]', isHidden: true },
    ],
    hints: [
      'Use a hash map where the key is the sorted version of each string.',
      'Strings with the same sorted form are anagrams of each other.',
      'Collect strings with the same key into the same group.',
    ],
  },

  {
    id: 'longest-substring-no-repeat',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'medium',
    category: 'Sliding Window',
    tags: ['sliding window', 'hashing', 'strings'],
    description:
      'Given a string `s`, find the length of the longest substring without repeating characters. Use the sliding window technique with a hash set to maintain the current window efficiently in O(n) time.',
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' },
      { input: 's = "pwwkew"', output: '3', explanation: 'The answer is "wke", with the length of 3.' },
    ],
    constraints: ['0 <= s.length <= 5 * 10^4', 's consists of English letters, digits, symbols and spaces.'],
    starterCode: {
      python: `def solution(s: str) -> int:
    # Write your solution here
    pass`,
      javascript: `function solution(s) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: 'abcabcbb', expected: '3' },
      { input: 'bbbbb', expected: '1' },
      { input: 'pwwkew', expected: '3' },
      { input: '', expected: '0', isHidden: true },
      { input: 'dvdf', expected: '3', isHidden: true },
    ],
    hints: [
      'Use a sliding window with left and right pointers.',
      'Maintain a set of characters in the current window.',
      "When you find a duplicate, move the left pointer right until the duplicate is removed.",
    ],
  },

  {
    id: '3sum',
    title: '3Sum',
    difficulty: 'medium',
    category: 'Arrays',
    tags: ['arrays', 'two pointers', 'sorting'],
    description:
      'Given an integer array `nums`, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, `j != k`, and `nums[i] + nums[j] + nums[k] == 0`. The solution set must not contain duplicate triplets.',
    examples: [
      {
        input: 'nums = [-1,0,1,2,-1,-4]',
        output: '[[-1,-1,2],[-1,0,1]]',
      },
      { input: 'nums = [0,1,1]', output: '[]' },
      { input: 'nums = [0,0,0]', output: '[[0,0,0]]' },
    ],
    constraints: ['3 <= nums.length <= 3000', '-10^5 <= nums[i] <= 10^5'],
    starterCode: {
      python: `def solution(nums: list[int]) -> list[list[int]]:
    # Write your solution here
    pass`,
      javascript: `function solution(nums) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[-1,0,1,2,-1,-4]', expected: '[[-1,-1,2],[-1,0,1]]' },
      { input: '[0,1,1]', expected: '[]' },
      { input: '[0,0,0]', expected: '[[0,0,0]]' },
      { input: '[-2,0,0,2,2]', expected: '[[-2,0,2]]', isHidden: true },
    ],
    hints: [
      'Sort the array first, then fix one element and use two pointers for the remaining two.',
      'Skip duplicate values of the fixed element to avoid duplicate triplets.',
      'When a valid triplet is found, move both pointers and skip duplicates again.',
    ],
  },

  {
    id: 'container-most-water',
    title: 'Container With Most Water',
    difficulty: 'medium',
    category: 'Arrays',
    tags: ['arrays', 'two pointers', 'greedy'],
    description:
      'You are given an integer array `height` of length `n`. There are `n` vertical lines where the two endpoints of the `i`th line are `(i, 0)` and `(i, height[i])`. Find two lines that together with the x-axis form a container that holds the most water. Return the maximum amount of water.',
    examples: [
      {
        input: 'height = [1,8,6,2,5,4,8,3,7]',
        output: '49',
        explanation: 'Lines at index 1 (height 8) and index 8 (height 7) form the largest container: min(8,7)*7 = 49.',
      },
      { input: 'height = [1,1]', output: '1' },
    ],
    constraints: ['n == height.length', '2 <= n <= 10^5', '0 <= height[i] <= 10^4'],
    starterCode: {
      python: `def solution(height: list[int]) -> int:
    # Write your solution here
    pass`,
      javascript: `function solution(height) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[1,8,6,2,5,4,8,3,7]', expected: '49' },
      { input: '[1,1]', expected: '1' },
      { input: '[4,3,2,1,4]', expected: '16' },
      { input: '[1,2,1]', expected: '2', isHidden: true },
    ],
    hints: [
      'Start with left = 0 and right = n-1.',
      'The area is min(height[left], height[right]) * (right - left).',
      'Move the pointer with the smaller height inward — this is the only way to potentially increase the area.',
    ],
  },

  {
    id: 'product-except-self',
    title: 'Product of Array Except Self',
    difficulty: 'medium',
    category: 'Arrays',
    tags: ['arrays', 'prefix sum'],
    description:
      'Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`. You must solve it in O(n) time without using the division operation and with O(1) extra space (the output array does not count).',
    examples: [
      { input: 'nums = [1,2,3,4]', output: '[24,12,8,6]' },
      { input: 'nums = [-1,1,0,-3,3]', output: '[0,0,9,0,0]' },
    ],
    constraints: ['2 <= nums.length <= 10^5', '-30 <= nums[i] <= 30', 'The product of any prefix or suffix of nums is guaranteed to fit in a 32-bit integer.'],
    starterCode: {
      python: `def solution(nums: list[int]) -> list[int]:
    # Write your solution here
    pass`,
      javascript: `function solution(nums) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[1,2,3,4]', expected: '[24,12,8,6]' },
      { input: '[-1,1,0,-3,3]', expected: '[0,0,9,0,0]' },
      { input: '[2,3]', expected: '[3,2]' },
      { input: '[1,1,1,1]', expected: '[1,1,1,1]', isHidden: true },
    ],
    hints: [
      'Build a prefix product array: prefix[i] = product of all elements before i.',
      'Build a suffix product array: suffix[i] = product of all elements after i.',
      'answer[i] = prefix[i] * suffix[i]. Optimize by computing suffix on-the-fly.',
    ],
  },

  {
    id: 'jump-game',
    title: 'Jump Game',
    difficulty: 'medium',
    category: 'Arrays',
    tags: ['arrays', 'greedy', 'dp'],
    description:
      'You are given an integer array `nums`. You are initially positioned at the first index. Each element represents your maximum jump length from that position. Return `true` if you can reach the last index, or `false` otherwise.',
    examples: [
      { input: 'nums = [2,3,1,1,4]', output: 'true', explanation: 'Jump 1 step from index 0 to 1, then 3 steps to the last index.' },
      { input: 'nums = [3,2,1,0,4]', output: 'false', explanation: 'You will always arrive at index 3 with a max jump of 0, preventing you from reaching index 4.' },
    ],
    constraints: ['1 <= nums.length <= 10^4', '0 <= nums[i] <= 10^5'],
    starterCode: {
      python: `def solution(nums: list[int]) -> bool:
    # Write your solution here
    pass`,
      javascript: `function solution(nums) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[2,3,1,1,4]', expected: 'true' },
      { input: '[3,2,1,0,4]', expected: 'false' },
      { input: '[0]', expected: 'true' },
      { input: '[1,0,0]', expected: 'false', isHidden: true },
      { input: '[1,1,1,1]', expected: 'true', isHidden: true },
    ],
    hints: [
      'Track the maximum index reachable so far.',
      'At each index i, update maxReach = max(maxReach, i + nums[i]).',
      'If i ever exceeds maxReach, return false. If maxReach >= n-1, return true.',
    ],
  },

  {
    id: 'coin-change',
    title: 'Coin Change',
    difficulty: 'medium',
    category: 'Dynamic Programming',
    tags: ['dp', 'arrays', 'bfs'],
    description:
      'You are given an integer array `coins` representing coins of different denominations and an integer `amount`. Return the fewest number of coins needed to make up that amount. If that amount cannot be made up by any combination, return -1. You may use each coin denomination any number of times.',
    examples: [
      { input: 'coins = [1,5,2], amount = 11', output: '3', explanation: '11 = 5 + 5 + 1.' },
      { input: 'coins = [2], amount = 3', output: '-1' },
      { input: 'coins = [1], amount = 0', output: '0' },
    ],
    constraints: ['1 <= coins.length <= 12', '1 <= coins[i] <= 2^31 - 1', '0 <= amount <= 10^4'],
    starterCode: {
      python: `def solution(coins: list[int], amount: int) -> int:
    # Write your solution here
    pass`,
      javascript: `function solution(coins, amount) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[1,5,2]\n11', expected: '3' },
      { input: '[2]\n3', expected: '-1' },
      { input: '[1]\n0', expected: '0' },
      { input: '[1,2,5]\n100', expected: '20', isHidden: true },
    ],
    hints: [
      'Use a dp array of size amount+1, where dp[i] = min coins to make amount i.',
      'Initialize dp[0] = 0 and dp[i] = infinity for i > 0.',
      'For each amount i, try all coins and update dp[i] = min(dp[i], dp[i-coin] + 1).',
    ],
  },

  {
    id: 'number-of-islands',
    title: 'Number of Islands',
    difficulty: 'medium',
    category: 'Graphs',
    tags: ['graphs', 'bfs', 'dfs', 'matrix'],
    description:
      'Given an `m x n` 2D binary grid where `1` represents land and `0` represents water, return the number of islands. An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically.',
    examples: [
      {
        input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]',
        output: '1',
      },
      {
        input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]',
        output: '3',
      },
    ],
    constraints: ['m == grid.length', 'n == grid[i].length', '1 <= m, n <= 300', 'grid[i][j] is "0" or "1".'],
    starterCode: {
      python: `def solution(grid: list[list[str]]) -> int:
    # Write your solution here
    pass`,
      javascript: `function solution(grid) {
    // Write your solution here
}`,
    },
    testCases: [
      {
        input: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]',
        expected: '1',
      },
      {
        input: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]',
        expected: '3',
      },
      { input: '[["0"]]', expected: '0' },
      { input: '[["1"]]', expected: '1', isHidden: true },
    ],
    hints: [
      'Iterate through each cell; when you find a "1", increment the count and run DFS/BFS.',
      'DFS/BFS marks all connected "1"s as visited (change to "0" or use a visited set).',
      'Each DFS/BFS call covers one entire island.',
    ],
  },

  {
    id: 'top-k-frequent',
    title: 'Top K Frequent Elements',
    difficulty: 'medium',
    category: 'Hashing',
    tags: ['hashing', 'heap', 'sorting', 'bucket sort'],
    description:
      'Given an integer array `nums` and an integer `k`, return the `k` most frequent elements. You may return the answer in any order. Your algorithm should be better than O(n log n) time complexity.',
    examples: [
      { input: 'nums = [1,1,1,2,2,3], k = 2', output: '[1,2]' },
      { input: 'nums = [1], k = 1', output: '[1]' },
    ],
    constraints: ['1 <= nums.length <= 10^5', '-10^4 <= nums[i] <= 10^4', 'k is in the range [1, the number of unique elements in the array]'],
    starterCode: {
      python: `def solution(nums: list[int], k: int) -> list[int]:
    # Write your solution here
    pass`,
      javascript: `function solution(nums, k) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[1,1,1,2,2,3]\n2', expected: '[1,2]' },
      { input: '[1]\n1', expected: '[1]' },
      { input: '[1,2]\n2', expected: '[1,2]' },
      { input: '[4,1,-1,2,-1,2,3]\n2', expected: '[-1,2]', isHidden: true },
    ],
    hints: [
      'Count frequencies with a hash map.',
      'Use a min-heap of size k, or bucket sort by frequency.',
      'Bucket sort approach: create buckets indexed by frequency and collect the top k.',
    ],
  },

  {
    id: 'daily-temperatures',
    title: 'Daily Temperatures',
    difficulty: 'medium',
    category: 'Stack',
    tags: ['stack', 'arrays', 'monotonic stack'],
    description:
      'Given an array of integers `temperatures` representing the daily temperature, return an array `answer` such that `answer[i]` is the number of days you have to wait after the `i`th day to get a warmer temperature. If there is no future warmer day, set `answer[i] = 0`.',
    examples: [
      { input: 'temperatures = [73,74,75,71,69,72,76,73]', output: '[1,1,4,2,1,1,0,0]' },
      { input: 'temperatures = [30,40,50,60]', output: '[1,1,1,0]' },
      { input: 'temperatures = [30,60,90]', output: '[1,1,0]' },
    ],
    constraints: ['1 <= temperatures.length <= 10^5', '30 <= temperatures[i] <= 100'],
    starterCode: {
      python: `def solution(temperatures: list[int]) -> list[int]:
    # Write your solution here
    pass`,
      javascript: `function solution(temperatures) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[73,74,75,71,69,72,76,73]', expected: '[1,1,4,2,1,1,0,0]' },
      { input: '[30,40,50,60]', expected: '[1,1,1,0]' },
      { input: '[30,60,90]', expected: '[1,1,0]' },
      { input: '[90,80,70,60]', expected: '[0,0,0,0]', isHidden: true },
    ],
    hints: [
      'Use a monotonic decreasing stack to store indices of temperatures.',
      'When the current temperature is greater than the temperature at the top of the stack, pop and compute the wait.',
      'The answer for a popped index i is current_index - i.',
    ],
  },

  {
    id: 'max-product-subarray',
    title: 'Maximum Product Subarray',
    difficulty: 'medium',
    category: 'Dynamic Programming',
    tags: ['dp', 'arrays'],
    description:
      'Given an integer array `nums`, find a contiguous subarray that has the largest product, and return the product. The challenge over maximum subarray sum is that a large negative number multiplied by another negative number can become the maximum product.',
    examples: [
      { input: 'nums = [2,3,-2,4]', output: '6', explanation: '[2,3] has the largest product = 6.' },
      { input: 'nums = [-2,0,-1]', output: '0', explanation: 'The result cannot be 2 because [-2,-1] is not a subarray.' },
    ],
    constraints: ['1 <= nums.length <= 2 * 10^4', '-10 <= nums[i] <= 10', 'The product of any subarray of nums is guaranteed to fit in a 32-bit integer.'],
    starterCode: {
      python: `def solution(nums: list[int]) -> int:
    # Write your solution here
    pass`,
      javascript: `function solution(nums) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[2,3,-2,4]', expected: '6' },
      { input: '[-2,0,-1]', expected: '0' },
      { input: '[-2,3,-4]', expected: '24' },
      { input: '[0,2]', expected: '2', isHidden: true },
      { input: '[-3,-1,-1]', expected: '3', isHidden: true },
    ],
    hints: [
      'Track both the current maximum and minimum product ending at each position.',
      'A negative * negative = positive, so the current min can become the next max.',
      'At each step: curMax = max(num, curMax*num, curMin*num), update curMin similarly.',
    ],
  },

  {
    id: 'word-search',
    title: 'Word Search',
    difficulty: 'medium',
    category: 'Backtracking',
    tags: ['backtracking', 'matrix', 'dfs'],
    description:
      'Given an `m x n` grid of characters `board` and a string `word`, return `true` if `word` exists in the grid. The word can be constructed from letters of sequentially adjacent cells (horizontally or vertically). The same cell may not be used more than once.',
    examples: [
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"', output: 'true' },
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "SEE"', output: 'true' },
      { input: 'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"', output: 'false' },
    ],
    constraints: ['m == board.length', 'n == board[i].length', '1 <= m, n <= 6', '1 <= word.length <= 15'],
    starterCode: {
      python: `def solution(board: list[list[str]], word: str) -> bool:
    # Write your solution here
    pass`,
      javascript: `function solution(board, word) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]\nABCCED', expected: 'true' },
      { input: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]\nSEE', expected: 'true' },
      { input: '[["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]]\nABCB', expected: 'false' },
      { input: '[["a"]]\na', expected: 'true', isHidden: true },
    ],
    hints: [
      'For each cell matching word[0], start a DFS.',
      'Mark cells as visited during DFS (e.g., temporarily change the character) and restore on backtrack.',
      'Check all four directions at each step and prune when word[index] does not match.',
    ],
  },

  {
    id: 'decode-ways',
    title: 'Decode Ways',
    difficulty: 'medium',
    category: 'Dynamic Programming',
    tags: ['dp', 'strings'],
    description:
      'A message containing letters A-Z is encoded using numbers 1-26. Given a string `s` of digits, return the number of ways to decode it. "0" cannot be decoded alone, and leading zeros make a sequence invalid.',
    examples: [
      { input: 's = "12"', output: '2', explanation: '"12" could be decoded as "AB" (1,2) or "L" (12).' },
      { input: 's = "226"', output: '3', explanation: '"226" can be decoded as "BZ" (2,26), "VF" (22,6), or "BBF" (2,2,6).' },
      { input: 's = "06"', output: '0', explanation: '"06" cannot be decoded because "06" is not a valid encoding (leading zero).' },
    ],
    constraints: ['1 <= s.length <= 100', 's contains only digits and may contain leading zeros.'],
    starterCode: {
      python: `def solution(s: str) -> int:
    # Write your solution here
    pass`,
      javascript: `function solution(s) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '12', expected: '2' },
      { input: '226', expected: '3' },
      { input: '06', expected: '0' },
      { input: '11106', expected: '2', isHidden: true },
      { input: '10', expected: '1', isHidden: true },
    ],
    hints: [
      'Use dp[i] = number of ways to decode s[0..i-1].',
      'A single digit is valid if it is not "0"; a two-digit number is valid if it is between 10 and 26.',
      'dp[i] += dp[i-1] if one-digit valid, dp[i] += dp[i-2] if two-digit valid.',
    ],
  },

  {
    id: 'longest-palindrome-substring',
    title: 'Longest Palindromic Substring',
    difficulty: 'medium',
    category: 'Dynamic Programming',
    tags: ['dp', 'strings', 'two pointers'],
    description:
      'Given a string `s`, return the longest palindromic substring. A palindrome reads the same forward and backward. Use the expand-around-center approach for an elegant O(n²) solution.',
    examples: [
      { input: 's = "babad"', output: '"bab"', explanation: '"aba" is also a valid answer.' },
      { input: 's = "cbbd"', output: '"bb"' },
    ],
    constraints: ['1 <= s.length <= 1000', 's consist of only digits and English letters.'],
    starterCode: {
      python: `def solution(s: str) -> str:
    # Write your solution here
    pass`,
      javascript: `function solution(s) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: 'babad', expected: 'bab' },
      { input: 'cbbd', expected: 'bb' },
      { input: 'a', expected: 'a' },
      { input: 'racecar', expected: 'racecar', isHidden: true },
      { input: 'abacaba', expected: 'abacaba', isHidden: true },
    ],
    hints: [
      'For each character, expand outward to find the longest palindrome centered there.',
      'Handle both odd-length (single center) and even-length (two-character center) palindromes.',
      'Track the start and length of the longest found palindrome.',
    ],
  },

  {
    id: 'rotate-image',
    title: 'Rotate Image',
    difficulty: 'medium',
    category: 'Arrays',
    tags: ['arrays', 'math', 'matrix'],
    description:
      'You are given an `n x n` 2D integer `matrix` representing an image. Rotate the image by 90 degrees (clockwise) in-place. You must rotate the matrix without allocating another 2D matrix.',
    examples: [
      { input: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]', output: '[[7,4,1],[8,5,2],[9,6,3]]' },
      { input: 'matrix = [[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]', output: '[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]' },
    ],
    constraints: ['n == matrix.length == matrix[i].length', '1 <= n <= 20', '-1000 <= matrix[i][j] <= 1000'],
    starterCode: {
      python: `def solution(matrix: list[list[int]]) -> list[list[int]]:
    # Write your solution here
    pass`,
      javascript: `function solution(matrix) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[[1,2,3],[4,5,6],[7,8,9]]', expected: '[[7,4,1],[8,5,2],[9,6,3]]' },
      { input: '[[5,1,9,11],[2,4,8,10],[13,3,6,7],[15,14,12,16]]', expected: '[[15,13,2,5],[14,3,4,1],[12,6,8,9],[16,7,10,11]]' },
      { input: '[[1]]', expected: '[[1]]' },
      { input: '[[1,2],[3,4]]', expected: '[[3,1],[4,2]]', isHidden: true },
    ],
    hints: [
      'First transpose the matrix (swap matrix[i][j] with matrix[j][i]).',
      'Then reverse each row.',
      'These two operations together produce a 90-degree clockwise rotation.',
    ],
  },

  {
    id: 'spiral-matrix',
    title: 'Spiral Matrix',
    difficulty: 'medium',
    category: 'Arrays',
    tags: ['arrays', 'simulation', 'matrix'],
    description:
      'Given an `m x n` matrix, return all elements of the matrix in spiral order (clockwise from the top-left corner). Simulate the spiral traversal by maintaining boundaries that shrink as you complete each layer.',
    examples: [
      { input: 'matrix = [[1,2,3],[4,5,6],[7,8,9]]', output: '[1,2,3,6,9,8,7,4,5]' },
      { input: 'matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]', output: '[1,2,3,4,8,12,11,10,9,5,6,7]' },
    ],
    constraints: ['m == matrix.length', 'n == matrix[i].length', '1 <= m, n <= 10', '-100 <= matrix[i][j] <= 100'],
    starterCode: {
      python: `def solution(matrix: list[list[int]]) -> list[int]:
    # Write your solution here
    pass`,
      javascript: `function solution(matrix) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[[1,2,3],[4,5,6],[7,8,9]]', expected: '[1,2,3,6,9,8,7,4,5]' },
      { input: '[[1,2,3,4],[5,6,7,8],[9,10,11,12]]', expected: '[1,2,3,4,8,12,11,10,9,5,6,7]' },
      { input: '[[1]]', expected: '[1]' },
      { input: '[[1,2],[3,4]]', expected: '[1,2,4,3]', isHidden: true },
    ],
    hints: [
      'Maintain four boundaries: top, bottom, left, right.',
      'Traverse right, down, left, up in order, shrinking the appropriate boundary after each pass.',
      'Stop when top > bottom or left > right.',
    ],
  },

  {
    id: 'search-2d-matrix',
    title: 'Search a 2D Matrix',
    difficulty: 'medium',
    category: 'Binary Search',
    tags: ['binary search', 'matrix'],
    description:
      'You are given an `m x n` integer matrix with the following properties: each row is sorted in ascending order, and the first integer of each row is greater than the last integer of the previous row. Given an integer `target`, return `true` if it is in the matrix, or `false` otherwise. Solve in O(log(m*n)) time.',
    examples: [
      { input: 'matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 3', output: 'true' },
      { input: 'matrix = [[1,3,5,7],[10,11,16,20],[23,30,34,60]], target = 13', output: 'false' },
    ],
    constraints: ['m == matrix.length', 'n == matrix[i].length', '1 <= m, n <= 100', '-10^4 <= matrix[i][j], target <= 10^4'],
    starterCode: {
      python: `def solution(matrix: list[list[int]], target: int) -> bool:
    # Write your solution here
    pass`,
      javascript: `function solution(matrix, target) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[[1,3,5,7],[10,11,16,20],[23,30,34,60]]\n3', expected: 'true' },
      { input: '[[1,3,5,7],[10,11,16,20],[23,30,34,60]]\n13', expected: 'false' },
      { input: '[[1]]\n1', expected: 'true' },
      { input: '[[1,3,5]]\n4', expected: 'false', isHidden: true },
    ],
    hints: [
      'Treat the 2D matrix as a flattened 1D sorted array of m*n elements.',
      'Binary search on indices 0..m*n-1; convert mid to row = mid//n, col = mid%n.',
      'This gives an O(log(m*n)) solution.',
    ],
  },

  {
    id: 'valid-sudoku',
    title: 'Valid Sudoku',
    difficulty: 'medium',
    category: 'Hashing',
    tags: ['hashing', 'matrix'],
    description:
      'Determine if a 9×9 Sudoku board is valid. Only the filled cells need to be validated according to: each row contains digits 1-9 without repetition, each column contains digits 1-9 without repetition, and each of the nine 3×3 sub-boxes contains digits 1-9 without repetition. Empty cells are denoted by ".".',
    examples: [
      {
        input: 'board = [["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]',
        output: 'true',
      },
    ],
    constraints: ['board.length == 9', 'board[i].length == 9', 'board[i][j] is a digit 1-9 or ".".'],
    starterCode: {
      python: `def solution(board: list[list[str]]) -> bool:
    # Write your solution here
    pass`,
      javascript: `function solution(board) {
    // Write your solution here
}`,
    },
    testCases: [
      {
        input: '[["5","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]',
        expected: 'true',
      },
      {
        input: '[["8","3",".",".","7",".",".",".","."],["6",".",".","1","9","5",".",".","."],[".","9","8",".",".",".",".","6","."],["8",".",".",".","6",".",".",".","3"],["4",".",".","8",".","3",".",".","1"],["7",".",".",".","2",".",".",".","6"],[".","6",".",".",".",".","2","8","."],[".",".",".","4","1","9",".",".","5"],[".",".",".",".","8",".",".","7","9"]]',
        expected: 'false',
      },
      {
        input: '[[".",".",".",".","5",".",".","1","."],[".","4",".","3",".",".",".",".","."],[".",".",".",".",".","3",".",".","1"],[".",".",".","1",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".","."],[".",".",".",".",".",".",".",".",","."]]',
        expected: 'false',
        isHidden: true,
      },
    ],
    hints: [
      'Use sets for each row, column, and 3×3 box.',
      'For cell (i, j), the box index is (i//3)*3 + j//3.',
      'If any digit is already in its row, column, or box set, the board is invalid.',
    ],
  },

  {
    id: 'clone-graph',
    title: 'Clone Graph',
    difficulty: 'medium',
    category: 'Graphs',
    tags: ['graphs', 'bfs', 'dfs', 'hashing'],
    description:
      'Given a reference of a node in a connected undirected graph, return a deep copy (clone) of the graph. Each node in the graph contains a value (int) and a list of its neighbors. Use a hash map to map original nodes to their clones to handle cycles.',
    examples: [
      { input: 'adjList = [[2,4],[1,3],[2,4],[1,3]]', output: '[[2,4],[1,3],[2,4],[1,3]]', explanation: 'The graph has 4 nodes, and its cloned adjacency list matches the original.' },
      { input: 'adjList = [[]]', output: '[[]]' },
    ],
    constraints: ['The number of nodes in the graph is in the range [0, 100].', '1 <= Node.val <= 100', 'Node.val is unique for each node.', 'The graph is connected and has no repeated edges or self-loops.'],
    starterCode: {
      python: `def solution(adjList: list[list[int]]) -> list[list[int]]:
    # Write your solution here
    pass`,
      javascript: `function solution(adjList) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[[2,4],[1,3],[2,4],[1,3]]', expected: '[[2,4],[1,3],[2,4],[1,3]]' },
      { input: '[[]]', expected: '[[]]' },
      { input: '[]', expected: '[]' },
      { input: '[[2],[1]]', expected: '[[2],[1]]', isHidden: true },
    ],
    hints: [
      'Use a hash map from original node to its clone to avoid revisiting nodes.',
      'BFS or DFS: when processing a node, create a clone if it does not exist yet.',
      'For each neighbor of the original node, recurse/enqueue and add the clone neighbor.',
    ],
  },

  // ─── HARD (10) ────────────────────────────────────────────────────────────

  {
    id: 'trapping-rain-water',
    title: 'Trapping Rain Water',
    difficulty: 'hard',
    category: 'Arrays',
    tags: ['arrays', 'two pointers', 'stack', 'dp'],
    description:
      'Given `n` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining. The optimal solution uses two pointers to achieve O(n) time and O(1) space.',
    examples: [
      { input: 'height = [0,1,0,2,1,0,1,3,2,1,2,1]', output: '6', explanation: 'The elevation map traps 6 units of water in the valleys.' },
      { input: 'height = [4,2,0,3,2,5]', output: '9' },
    ],
    constraints: ['n == height.length', '1 <= n <= 2 * 10^4', '0 <= height[i] <= 10^5'],
    starterCode: {
      python: `def solution(height: list[int]) -> int:
    # Write your solution here
    pass`,
      javascript: `function solution(height) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[0,1,0,2,1,0,1,3,2,1,2,1]', expected: '6' },
      { input: '[4,2,0,3,2,5]', expected: '9' },
      { input: '[3,0,2,0,4]', expected: '7' },
      { input: '[1,0,1]', expected: '1', isHidden: true },
      { input: '[0,0,0]', expected: '0', isHidden: true },
    ],
    hints: [
      'For each position, water trapped = min(maxLeft, maxRight) - height[i].',
      'Precompute maxLeft and maxRight arrays in O(n) time and O(n) space.',
      'For O(1) space, use two pointers: move whichever side has the smaller max height.',
    ],
  },

  {
    id: 'median-two-sorted',
    title: 'Median of Two Sorted Arrays',
    difficulty: 'hard',
    category: 'Binary Search',
    tags: ['binary search', 'arrays', 'divide and conquer'],
    description:
      'Given two sorted arrays `nums1` and `nums2` of sizes `m` and `n`, return the median of the two sorted arrays. The overall run time complexity must be O(log(m+n)). Binary search on the smaller array to find the correct partition.',
    examples: [
      { input: 'nums1 = [1,3], nums2 = [2]', output: '2.0', explanation: 'Merged array = [1,2,3] and median is 2.' },
      { input: 'nums1 = [1,2], nums2 = [3,4]', output: '2.5', explanation: 'Merged array = [1,2,3,4] and median is (2+3)/2 = 2.5.' },
    ],
    constraints: ['nums1.length == m', 'nums2.length == n', '0 <= m <= 1000', '0 <= n <= 1000', '1 <= m + n <= 2000', '-10^6 <= nums1[i], nums2[i] <= 10^6'],
    starterCode: {
      python: `def solution(nums1: list[int], nums2: list[int]) -> float:
    # Write your solution here
    pass`,
      javascript: `function solution(nums1, nums2) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[1,3]\n[2]', expected: '2.0' },
      { input: '[1,2]\n[3,4]', expected: '2.5' },
      { input: '[0,0]\n[0,0]', expected: '0.0' },
      { input: '[]\n[1]', expected: '1.0', isHidden: true },
      { input: '[2]\n[]', expected: '2.0', isHidden: true },
    ],
    hints: [
      'Binary search on the smaller array to find the partition point.',
      'A valid partition satisfies: max of left halves <= min of right halves.',
      'Handle edge cases when the partition is at the boundary (use -Inf and +Inf as sentinels).',
    ],
  },

  {
    id: 'merge-k-sorted',
    title: 'Merge K Sorted Lists',
    difficulty: 'hard',
    category: 'Heap',
    tags: ['heap', 'linked list', 'divide and conquer'],
    description:
      'You are given an array of `k` linked lists, each sorted in ascending order. Merge all the linked lists into one sorted list and return it. The most efficient approach uses a min-heap (priority queue) of size k.',
    examples: [
      { input: 'lists = [[1,4,5],[1,3,4],[2,6]]', output: '[1,1,2,3,4,4,5,6]' },
      { input: 'lists = []', output: '[]' },
      { input: 'lists = [[]]', output: '[]' },
    ],
    constraints: ['k == lists.length', '0 <= k <= 10^4', '0 <= lists[i].length <= 500', '-10^4 <= lists[i][j] <= 10^4'],
    starterCode: {
      python: `def solution(lists: list[list[int]]) -> list[int]:
    # Write your solution here
    pass`,
      javascript: `function solution(lists) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[[1,4,5],[1,3,4],[2,6]]', expected: '[1,1,2,3,4,4,5,6]' },
      { input: '[]', expected: '[]' },
      { input: '[[]]', expected: '[]' },
      { input: '[[1],[0]]', expected: '[0,1]', isHidden: true },
    ],
    hints: [
      'Initialize a min-heap with the first element from each non-empty list.',
      'Pop the minimum element, add it to the result, and push the next element from the same list.',
      'Alternatively, use divide-and-conquer: repeatedly merge pairs of lists.',
    ],
  },

  {
    id: 'minimum-window-substring',
    title: 'Minimum Window Substring',
    difficulty: 'hard',
    category: 'Sliding Window',
    tags: ['sliding window', 'hashing', 'strings', 'two pointers'],
    description:
      'Given two strings `s` and `t`, return the minimum window substring of `s` such that every character in `t` (including duplicates) is included in the window. If no such window exists, return the empty string "". The solution should run in O(|s|+|t|) time.',
    examples: [
      { input: 's = "ADOBECODEBANC", t = "ABC"', output: '"BANC"', explanation: '"BANC" is the minimum window in s that contains all characters of t.' },
      { input: 's = "a", t = "a"', output: '"a"' },
      { input: 's = "a", t = "aa"', output: '""', explanation: 'Both "a"s need to be in the window but s only has one.' },
    ],
    constraints: ['m == s.length', 'n == t.length', '1 <= m, n <= 10^5', 's and t consist of uppercase and lowercase English letters.'],
    starterCode: {
      python: `def solution(s: str, t: str) -> str:
    # Write your solution here
    pass`,
      javascript: `function solution(s, t) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: 'ADOBECODEBANC\nABC', expected: 'BANC' },
      { input: 'a\na', expected: 'a' },
      { input: 'a\naa', expected: '' },
      { input: 'cabwefgewcwaefgcf\ncae', expected: 'cwae', isHidden: true },
    ],
    hints: [
      'Use two frequency maps: one for t and one for the current window.',
      'Expand the right pointer to include characters; once all t characters are covered, shrink the left pointer.',
      'Track "formed" count to know when the window is valid, and update the minimum window accordingly.',
    ],
  },

  {
    id: 'largest-rectangle-histogram',
    title: 'Largest Rectangle in Histogram',
    difficulty: 'hard',
    category: 'Stack',
    tags: ['stack', 'arrays', 'monotonic stack'],
    description:
      'Given an array of integers `heights` representing the histogram\'s bar heights where the width of each bar is 1, return the area of the largest rectangle in the histogram. A monotonic increasing stack allows an O(n) solution.',
    examples: [
      { input: 'heights = [2,1,5,6,2,3]', output: '10', explanation: 'The largest rectangle has an area of 10 (bars at index 2 and 3 with height 5*2=10).' },
      { input: 'heights = [2,4]', output: '4' },
    ],
    constraints: ['1 <= heights.length <= 10^5', '0 <= heights[i] <= 10^4'],
    starterCode: {
      python: `def solution(heights: list[int]) -> int:
    # Write your solution here
    pass`,
      javascript: `function solution(heights) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[2,1,5,6,2,3]', expected: '10' },
      { input: '[2,4]', expected: '4' },
      { input: '[1]', expected: '1' },
      { input: '[6,2,5,4,5,1,6]', expected: '12', isHidden: true },
    ],
    hints: [
      'Use a monotonic increasing stack that stores indices.',
      'When a bar is shorter than the stack top, pop and compute the area using the popped bar as height.',
      'The width extends from the new stack top + 1 to the current index - 1.',
    ],
  },

  {
    id: 'word-ladder',
    title: 'Word Ladder',
    difficulty: 'hard',
    category: 'Graphs',
    tags: ['bfs', 'graphs', 'strings', 'hashing'],
    description:
      'A transformation sequence from word `beginWord` to word `endWord` using a dictionary `wordList` is a sequence where each consecutive pair of words differs by exactly one letter, and every word in the sequence (except beginWord) is in wordList. Return the number of words in the shortest transformation sequence, or 0 if no path exists.',
    examples: [
      { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', output: '5', explanation: '"hit" -> "hot" -> "dot" -> "dog" -> "cog" has length 5.' },
      { input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log"]', output: '0', explanation: 'endWord "cog" is not in wordList.' },
    ],
    constraints: ['1 <= beginWord.length <= 10', 'endWord.length == beginWord.length', '1 <= wordList.length <= 5000'],
    starterCode: {
      python: `def solution(beginWord: str, endWord: str, wordList: list[str]) -> int:
    # Write your solution here
    pass`,
      javascript: `function solution(beginWord, endWord, wordList) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: 'hit\ncog\n["hot","dot","dog","lot","log","cog"]', expected: '5' },
      { input: 'hit\ncog\n["hot","dot","dog","lot","log"]', expected: '0' },
      { input: 'a\nc\n["a","b","c"]', expected: '2' },
      { input: 'hot\ndog\n["hot","dog","dot"]', expected: '3', isHidden: true },
    ],
    hints: [
      'Model this as a shortest path problem and use BFS.',
      'For each word in the queue, try changing each character to every letter a-z.',
      'If the new word is in the word set, add it to the queue and remove it from the set to avoid revisiting.',
    ],
  },

  {
    id: 'regex-matching',
    title: 'Regular Expression Matching',
    difficulty: 'hard',
    category: 'Dynamic Programming',
    tags: ['dp', 'strings', 'recursion'],
    description:
      'Given an input string `s` and a pattern `p`, implement regular expression matching with support for `.` (matches any single character) and `*` (matches zero or more of the preceding element). The matching should cover the entire input string (not partial).',
    examples: [
      { input: 's = "aa", p = "a"', output: 'false', explanation: '"a" does not match the entire string "aa".' },
      { input: 's = "aa", p = "a*"', output: 'true', explanation: '"a*" means zero or more "a"s, which matches "aa".' },
      { input: 's = "ab", p = ".*"', output: 'true', explanation: '".*" means zero or more of any character.' },
    ],
    constraints: ['1 <= s.length <= 20', '1 <= p.length <= 20', 's contains only lowercase English letters.', 'p contains only lowercase English letters, ".", and "*".'],
    starterCode: {
      python: `def solution(s: str, p: str) -> bool:
    # Write your solution here
    pass`,
      javascript: `function solution(s, p) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: 'aa\na', expected: 'false' },
      { input: 'aa\na*', expected: 'true' },
      { input: 'ab\n.*', expected: 'true' },
      { input: 'aab\nc*a*b', expected: 'true', isHidden: true },
      { input: 'mississippi\nmis*is*p*.', expected: 'false', isHidden: true },
    ],
    hints: [
      'Define dp[i][j] = whether s[0..i-1] matches p[0..j-1].',
      'If p[j-1] is "*", it can match zero occurrences (dp[i][j-2]) or one-or-more if the char matches.',
      'If p[j-1] is "." or equals s[i-1], dp[i][j] = dp[i-1][j-1].',
    ],
  },

  {
    id: 'serialize-deserialize-bst',
    title: 'Serialize and Deserialize BST',
    difficulty: 'hard',
    category: 'Trees',
    tags: ['trees', 'bfs', 'dfs', 'design'],
    description:
      'Design an algorithm to serialize and deserialize a binary search tree. Serialization is the process of converting a data structure into a sequence of bits so it can be stored or transmitted and reconstructed later. Your encoded string should be compact.',
    examples: [
      { input: 'root = [2,1,3]', output: '[2,1,3]', explanation: 'The tree [2,1,3] is serialized and then deserialized back to the same tree.' },
      { input: 'root = []', output: '[]' },
    ],
    constraints: ['The number of nodes in the tree is in the range [0, 10^4].', '0 <= Node.val <= 10^4', 'The input tree is guaranteed to be a BST.'],
    starterCode: {
      python: `def solution(root: list) -> list:
    # Write your solution here - serialize and deserialize
    pass`,
      javascript: `function solution(root) {
    // Write your solution here - serialize and deserialize
}`,
    },
    testCases: [
      { input: '[2,1,3]', expected: '[2,1,3]' },
      { input: '[]', expected: '[]' },
      { input: '[1,null,2]', expected: '[1,null,2]' },
      { input: '[4,2,6,1,3,5,7]', expected: '[4,2,6,1,3,5,7]', isHidden: true },
    ],
    hints: [
      'Use preorder traversal for serialization — for a BST, preorder uniquely determines the tree.',
      'Deserialize by reading values and inserting them into a BST using BST properties.',
      'Or use level-order (BFS) serialization with null markers for missing nodes.',
    ],
  },

  {
    id: 'alien-dictionary',
    title: 'Alien Dictionary',
    difficulty: 'hard',
    category: 'Graphs',
    tags: ['graphs', 'topological sort', 'bfs', 'strings'],
    description:
      'There is an alien language that uses the English alphabet but the letters are in a different order. You are given a list of words from the alien language dictionary, sorted lexicographically by the rules of this language. Derive the order of letters and return it as a string. If no valid order exists, return "".',
    examples: [
      { input: 'words = ["wrt","wrf","er","ett","rftt"]', output: '"wertf"' },
      { input: 'words = ["z","x"]', output: '"zx"' },
      { input: 'words = ["z","x","z"]', output: '""', explanation: 'Cycle detected: invalid ordering.' },
    ],
    constraints: ['1 <= words.length <= 100', '1 <= words[i].length <= 100', 'words[i] consists of only lowercase English letters.'],
    starterCode: {
      python: `def solution(words: list[str]) -> str:
    # Write your solution here
    pass`,
      javascript: `function solution(words) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '["wrt","wrf","er","ett","rftt"]', expected: 'wertf' },
      { input: '["z","x"]', expected: 'zx' },
      { input: '["z","x","z"]', expected: '' },
      { input: '["abc","ab"]', expected: '', isHidden: true },
    ],
    hints: [
      'Compare adjacent words to derive ordering constraints (edges in a directed graph).',
      'Use topological sort (Kahn\'s algorithm or DFS) to find a valid order.',
      'If a cycle is detected or the graph is inconsistent, return "".',
    ],
  },

  {
    id: 'critical-connections',
    title: 'Critical Connections in a Network',
    difficulty: 'hard',
    category: 'Graphs',
    tags: ['graphs', 'dfs', 'bridges'],
    description:
      'There are `n` servers numbered from 0 to n-1, connected by undirected server-to-server connections. A critical connection is a connection that, if removed, will make some servers unable to reach some other server. Return all critical connections (bridges) in any order.',
    examples: [
      { input: 'n = 4, connections = [[0,1],[1,2],[2,0],[1,3]]', output: '[[1,3]]', explanation: 'Removing [1,3] disconnects server 3.' },
      { input: 'n = 2, connections = [[0,1]]', output: '[[0,1]]' },
    ],
    constraints: ['2 <= n <= 10^5', 'n - 1 <= connections.length <= 10^5', '0 <= ai, bi <= n - 1', 'ai != bi', 'There are no repeated connections.'],
    starterCode: {
      python: `def solution(n: int, connections: list[list[int]]) -> list[list[int]]:
    # Write your solution here
    pass`,
      javascript: `function solution(n, connections) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '4\n[[0,1],[1,2],[2,0],[1,3]]', expected: '[[1,3]]' },
      { input: '2\n[[0,1]]', expected: '[[0,1]]' },
      { input: '3\n[[0,1],[1,2],[2,0]]', expected: '[]' },
      { input: '5\n[[1,0],[2,0],[3,2],[4,2],[4,3],[3,0],[4,0]]', expected: '[[0,1]]', isHidden: true },
    ],
    hints: [
      'Use Tarjan\'s algorithm for finding bridges in an undirected graph.',
      'Maintain discovery time and low values for each node during DFS.',
      'An edge (u, v) is a bridge if low[v] > disc[u], meaning v cannot reach u or any ancestor without using the edge.',
    ],
  },

  // ─── EXPERT (5) ───────────────────────────────────────────────────────────

  {
    id: 'lru-cache',
    title: 'LRU Cache',
    difficulty: 'expert',
    category: 'Design',
    tags: ['design', 'hashing', 'linked list'],
    description:
      'Design a data structure that follows the Least Recently Used (LRU) cache constraints. Implement the `LRUCache` class with `get(key)` and `put(key, value)` operations, both running in O(1) average time. When the capacity is reached, evict the least recently used item before inserting a new one.',
    examples: [
      {
        input: 'LRUCache(2), put(1,1), put(2,2), get(1), put(3,3), get(2), put(4,4), get(1), get(3), get(4)',
        output: '[null,null,null,1,null,-1,null,1,3,4]',
        explanation: 'Cache capacity is 2. get(2) returns -1 because key 2 was evicted when key 3 was inserted.',
      },
    ],
    constraints: ['1 <= capacity <= 3000', '0 <= key <= 10^4', '0 <= value <= 10^5', 'At most 2 * 10^5 calls will be made to get and put.'],
    starterCode: {
      python: `class LRUCache:
    def __init__(self, capacity: int):
        # Write your solution here
        pass

    def get(self, key: int) -> int:
        # Write your solution here
        pass

    def put(self, key: int, value: int) -> None:
        # Write your solution here
        pass

def solution(capacity: int, operations: list) -> list:
    cache = LRUCache(capacity)
    return [cache.put(k, v) if op == 'put' else cache.get(k) for op, k, *v in operations]`,
      javascript: `class LRUCache {
    constructor(capacity) {
        // Write your solution here
    }

    get(key) {
        // Write your solution here
    }

    put(key, value) {
        // Write your solution here
    }
}

function solution(capacity, operations) {
    const cache = new LRUCache(capacity);
    return operations.map(([op, k, v]) => op === 'put' ? cache.put(k, v) : cache.get(k));
}`,
    },
    testCases: [
      {
        input: '2\n[["put",1,1],["put",2,2],["get",1],["put",3,3],["get",2],["put",4,4],["get",1],["get",3],["get",4]]',
        expected: '[null,null,1,null,-1,null,1,3,4]',
      },
      {
        input: '1\n[["put",2,1],["get",2],["put",3,2],["get",2],["get",3]]',
        expected: '[null,1,null,-1,2]',
      },
      {
        input: '2\n[["put",1,1],["put",2,2],["get",1],["put",3,3],["get",1],["get",2]]',
        expected: '[null,null,1,null,1,-1]',
        isHidden: true,
      },
    ],
    hints: [
      'Combine a hash map and a doubly linked list: the map gives O(1) access, and the list maintains order.',
      'The most recently used item goes to the front (or back); evict from the opposite end.',
      'On every get or put, move the accessed node to the front of the list.',
    ],
  },

  {
    id: 'lfu-cache',
    title: 'LFU Cache',
    difficulty: 'expert',
    category: 'Design',
    tags: ['design', 'hashing', 'linked list'],
    description:
      'Design and implement a Least Frequently Used (LFU) cache. When the cache reaches capacity, evict the least frequently used key. If multiple keys have the same frequency, evict the least recently used among them. All operations must run in O(1) time.',
    examples: [
      {
        input: 'LFUCache(2), put(1,1), put(2,2), get(1), put(3,3), get(2), get(3), put(4,4), get(1), get(3), get(4)',
        output: '[null,null,null,1,null,-1,3,null,1,3,4]',
      },
    ],
    constraints: ['0 <= capacity <= 10^4', '0 <= key <= 10^5', '0 <= value <= 10^9', 'At most 2 * 10^5 calls will be made to get and put.'],
    starterCode: {
      python: `class LFUCache:
    def __init__(self, capacity: int):
        # Write your solution here
        pass

    def get(self, key: int) -> int:
        # Write your solution here
        pass

    def put(self, key: int, value: int) -> None:
        # Write your solution here
        pass

def solution(capacity: int, operations: list) -> list:
    cache = LFUCache(capacity)
    return [cache.put(k, v) if op == 'put' else cache.get(k) for op, k, *v in operations]`,
      javascript: `class LFUCache {
    constructor(capacity) {
        // Write your solution here
    }

    get(key) {
        // Write your solution here
    }

    put(key, value) {
        // Write your solution here
    }
}

function solution(capacity, operations) {
    const cache = new LFUCache(capacity);
    return operations.map(([op, k, v]) => op === 'put' ? cache.put(k, v) : cache.get(k));
}`,
    },
    testCases: [
      {
        input: '2\n[["put",1,1],["put",2,2],["get",1],["put",3,3],["get",2],["get",3],["put",4,4],["get",1],["get",3],["get",4]]',
        expected: '[null,null,1,null,-1,3,null,1,3,4]',
      },
      {
        input: '0\n[["put",0,0]]',
        expected: '[null]',
      },
      {
        input: '1\n[["put",1,1],["get",1],["put",2,2],["get",1],["get",2]]',
        expected: '[null,1,null,-1,2]',
        isHidden: true,
      },
    ],
    hints: [
      'Use three hash maps: key->value, key->frequency, frequency->OrderedDict of keys.',
      'Track the minimum frequency at all times; when capacity is exceeded, evict the LRU key at minFreq.',
      'On get/put, increment the frequency, move the key to the new frequency bucket, and update minFreq.',
    ],
  },

  {
    id: 'design-twitter',
    title: 'Design Twitter',
    difficulty: 'expert',
    category: 'Design',
    tags: ['design', 'heap', 'hashing'],
    description:
      'Design a simplified version of Twitter where users can post tweets, follow/unfollow other users, and see the 10 most recent tweets in the user\'s news feed. Each tweet has a unique ID and a timestamp. The news feed includes tweets from the user and all users they follow.',
    examples: [
      {
        input: 'postTweet(1,5), getNewsFeed(1), follow(1,2), postTweet(2,6), getNewsFeed(1), unfollow(1,2), getNewsFeed(1)',
        output: '[null,[5],null,null,[6,5],null,[5]]',
      },
    ],
    constraints: ['1 <= userId, followerId, followeeId <= 500', '0 <= tweetId <= 10^4', 'All tweets have unique IDs.', 'At most 3 * 10^4 calls will be made to all functions.'],
    starterCode: {
      python: `class Twitter:
    def __init__(self):
        # Write your solution here
        pass

    def postTweet(self, userId: int, tweetId: int) -> None:
        pass

    def getNewsFeed(self, userId: int) -> list[int]:
        pass

    def follow(self, followerId: int, followeeId: int) -> None:
        pass

    def unfollow(self, followerId: int, followeeId: int) -> None:
        pass

def solution(operations: list) -> list:
    twitter = Twitter()
    results = []
    for op, *args in operations:
        if op == 'postTweet': results.append(twitter.postTweet(*args))
        elif op == 'getNewsFeed': results.append(twitter.getNewsFeed(*args))
        elif op == 'follow': results.append(twitter.follow(*args))
        elif op == 'unfollow': results.append(twitter.unfollow(*args))
    return results`,
      javascript: `class Twitter {
    constructor() {
        // Write your solution here
    }
    postTweet(userId, tweetId) {}
    getNewsFeed(userId) {}
    follow(followerId, followeeId) {}
    unfollow(followerId, followeeId) {}
}

function solution(operations) {
    const tw = new Twitter();
    return operations.map(([op, ...args]) => tw[op](...args));
}`,
    },
    testCases: [
      {
        input: '[["postTweet",1,5],["getNewsFeed",1],["follow",1,2],["postTweet",2,6],["getNewsFeed",1],["unfollow",1,2],["getNewsFeed",1]]',
        expected: '[null,[5],null,null,[6,5],null,[5]]',
      },
      {
        input: '[["postTweet",1,1],["postTweet",1,2],["postTweet",1,3],["getNewsFeed",1]]',
        expected: '[null,null,null,[3,2,1]]',
      },
      {
        input: '[["follow",1,2],["follow",1,3],["postTweet",2,10],["postTweet",3,20],["getNewsFeed",1]]',
        expected: '[null,null,null,null,[20,10]]',
        isHidden: true,
      },
    ],
    hints: [
      'Use a hash map from userId to their list of (timestamp, tweetId) pairs.',
      'Use a hash map from userId to their set of followees.',
      'For getNewsFeed, collect tweets from the user and all followees, then use a max-heap to get the 10 most recent.',
    ],
  },

  {
    id: 'min-cost-connect-points',
    title: 'Minimum Cost to Connect All Points',
    difficulty: 'expert',
    category: 'Graphs',
    tags: ['graphs', 'mst', 'greedy', 'heap'],
    description:
      'You are given an array `points` representing integer coordinates of some points on a 2D-plane. The cost to connect two points is the Manhattan distance between them. Return the minimum cost to make all points connected (minimum spanning tree). Use Prim\'s or Kruskal\'s algorithm.',
    examples: [
      {
        input: 'points = [[0,0],[2,2],[3,10],[5,2],[7,0]]',
        output: '20',
        explanation: 'The minimum spanning tree connects all 5 points with total cost 20.',
      },
      { input: 'points = [[3,12],[-2,5],[-4,1]]', output: '18' },
    ],
    constraints: ['1 <= points.length <= 1000', '-10^6 <= xi, yi <= 10^6', 'All pairs (xi, yi) are distinct.'],
    starterCode: {
      python: `def solution(points: list[list[int]]) -> int:
    # Write your solution here
    pass`,
      javascript: `function solution(points) {
    // Write your solution here
}`,
    },
    testCases: [
      { input: '[[0,0],[2,2],[3,10],[5,2],[7,0]]', expected: '20' },
      { input: '[[3,12],[-2,5],[-4,1]]', expected: '18' },
      { input: '[[0,0],[1,1],[1,0],[0,1]]', expected: '3' },
      { input: '[[-1000000,-1000000],[1000000,1000000]]', expected: '4000000', isHidden: true },
    ],
    hints: [
      'This is a minimum spanning tree problem; use Prim\'s algorithm with a min-heap.',
      'Start from any node. Greedily add the cheapest edge connecting a visited node to an unvisited node.',
      'Manhattan distance between (x1,y1) and (x2,y2) is |x1-x2| + |y1-y2|.',
    ],
  },

  {
    id: 'find-median-stream',
    title: 'Find Median from Data Stream',
    difficulty: 'expert',
    category: 'Design',
    tags: ['design', 'heap', 'sorting'],
    description:
      'Design a data structure that supports adding integers from a data stream and finding the median of all elements seen so far. `addNum(num)` adds an integer, and `findMedian()` returns the median. All operations should run in O(log n) for addNum and O(1) for findMedian.',
    examples: [
      {
        input: 'addNum(1), addNum(2), findMedian(), addNum(3), findMedian()',
        output: '[null,null,1.5,null,2.0]',
        explanation: 'After adding 1 and 2, median is 1.5. After adding 3, median is 2.0.',
      },
    ],
    constraints: ['-10^5 <= num <= 10^5', 'There will be at least one element before calling findMedian.', 'At most 5 * 10^4 calls to addNum and findMedian.'],
    starterCode: {
      python: `import heapq

class MedianFinder:
    def __init__(self):
        # Write your solution here
        pass

    def addNum(self, num: int) -> None:
        # Write your solution here
        pass

    def findMedian(self) -> float:
        # Write your solution here
        pass

def solution(operations: list) -> list:
    mf = MedianFinder()
    results = []
    for op, *args in operations:
        if op == 'addNum': results.append(mf.addNum(*args))
        else: results.append(mf.findMedian())
    return results`,
      javascript: `class MedianFinder {
    constructor() {
        // Write your solution here
    }
    addNum(num) {
        // Write your solution here
    }
    findMedian() {
        // Write your solution here
    }
}

function solution(operations) {
    const mf = new MedianFinder();
    return operations.map(([op, ...args]) => op === 'addNum' ? mf.addNum(...args) : mf.findMedian());
}`,
    },
    testCases: [
      {
        input: '[["addNum",1],["addNum",2],["findMedian"],["addNum",3],["findMedian"]]',
        expected: '[null,null,1.5,null,2.0]',
      },
      {
        input: '[["addNum",6],["findMedian"],["addNum",10],["findMedian"],["addNum",2],["findMedian"],["addNum",6],["findMedian"]]',
        expected: '[null,6.0,null,8.0,null,6.0,null,6.0]',
      },
      {
        input: '[["addNum",1],["addNum",2],["addNum",3],["addNum",4],["findMedian"]]',
        expected: '[null,null,null,null,2.5]',
        isHidden: true,
      },
    ],
    hints: [
      'Use two heaps: a max-heap for the lower half and a min-heap for the upper half.',
      'Always keep them balanced (sizes differ by at most 1).',
      'Median is the top of the larger heap, or the average of both tops if equal size.',
    ],
  },
]
