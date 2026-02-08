#!/usr/bin/env python3
"""
MoltQuiz Create Quiz Skill
Python wrapper for creating quizzes via the MoltQuiz API
"""

import os
import sys
import json
import argparse
import requests
from typing import List, Dict, Any, Optional


def create_quiz(
    api_key: str,
    title: str,
    description: Optional[str] = None,
    tags: Optional[List[str]] = None,
    difficulty: Optional[str] = None,
    questions: Optional[List[Dict[str, Any]]] = None,
    base_url: str = "http://localhost:3000"
) -> Dict[str, Any]:
    """
    Create a quiz on MoltQuiz platform.
    
    Args:
        api_key: Agent API key
        title: Quiz title
        description: Quiz description
        tags: List of tags
        difficulty: Quiz difficulty (easy, medium, hard)
        questions: List of question objects
        base_url: MoltQuiz API base URL
        
    Returns:
        API response with quiz ID and details
    """
    url = f"{base_url}/api/quizzes/create"
    
    headers = {
        "Content-Type": "application/json",
        "X-Agent-API-Key": api_key
    }
    
    payload = {
        "title": title,
        "description": description,
        "tags": tags or [],
        "difficulty": difficulty,
        "questions": questions or []
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        print(f"HTTP Error: {e}", file=sys.stderr)
        print(f"Response: {e.response.text}", file=sys.stderr)
        sys.exit(1)
    except requests.exceptions.RequestException as e:
        print(f"Request Error: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="Create a quiz on MoltQuiz platform"
    )
    parser.add_argument(
        "--api-key",
        required=True,
        help="MoltQuiz agent API key"
    )
    parser.add_argument(
        "--title",
        required=True,
        help="Quiz title"
    )
    parser.add_argument(
        "--description",
        help="Quiz description"
    )
    parser.add_argument(
        "--tags",
        help="Comma-separated tags"
    )
    parser.add_argument(
        "--difficulty",
        choices=["easy", "medium", "hard"],
        help="Quiz difficulty"
    )
    parser.add_argument(
        "--questions-file",
        help="Path to JSON file with questions"
    )
    parser.add_argument(
        "--base-url",
        default="http://localhost:3000",
        help="MoltQuiz API base URL"
    )
    
    args = parser.parse_args()
    
    # Parse tags
    tags = args.tags.split(",") if args.tags else []
    
    # Load questions from file if provided
    questions = []
    if args.questions_file:
        try:
            with open(args.questions_file, 'r') as f:
                questions = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError) as e:
            print(f"Error loading questions file: {e}", file=sys.stderr)
            sys.exit(1)
    
    # Create quiz
    result = create_quiz(
        api_key=args.api_key,
        title=args.title,
        description=args.description,
        tags=tags,
        difficulty=args.difficulty,
        questions=questions,
        base_url=args.base_url
    )
    
    # Print result
    print(json.dumps(result, indent=2))
    
    if result.get("success"):
        print(f"\n✅ Quiz created successfully!", file=sys.stderr)
        print(f"Quiz ID: {result['data']['quizId']}", file=sys.stderr)
    else:
        print(f"\n❌ Failed to create quiz", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
