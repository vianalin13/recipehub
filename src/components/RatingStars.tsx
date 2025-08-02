"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface RatingStarsProps {
  recipeId: number;
  averageRating?: number;
  ratingCount?: number;
  userRating?: number;
  onRatingChange?: (_rating: number) => void;
}

export default function RatingStars({
  recipeId,
  averageRating,
  ratingCount = 0,
  userRating,
  onRatingChange //callback function when user submits a new rating, allows parent to react to rating change
} : RatingStarsProps) { //interface its getting these param values from
  const { data: session } = useSession();
  const [hoverRating, setHoverRating] = useState(0); //which star user is hovering 
  const [currentRating, setCurrentRating] = useState(userRating || 0); //users actual rating
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCurrentRating(userRating || 0);
  }, [userRating]);

  const handleStarClick = async (rating: number) => {
    if(!session) {
      alert("Please log in to rate recipe");
      return;
    }

    if(isSubmitting) {return;}
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/recipes/${recipeId}/ratings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({rating}),
      });

      if(response.ok) {
        setCurrentRating(rating);
        onRatingChange?.(rating);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to submit rating");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStarHover = (rating: number) => {
    setHoverRating(rating);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  const renderStar = (starNumber: number) => {
    const isFilled = starNumber <= (hoverRating || currentRating);

    return (
      <button
        key={starNumber}
        type="button"
        className={`text-2xl transition-colors duration-200 ${
          isFilled ? "text-yellow-400" : "text-gray-300"
        } hover:text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 rounded`}
        onClick={() => handleStarClick(starNumber)}
        onMouseEnter={() => handleStarHover(starNumber)}
        onMouseLeave={handleMouseLeave}
        disabled={isSubmitting}
        aria-label={`Rate ${starNumber} star${starNumber !== 1? "s" : ""}`}
      >
        ★
      </button>
    );
  };

  return (
    <div className="flex flex-col items-start space-y-2">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map(renderStar)}
        </div>
        {session && (
          <span className="text-sm text-gray-600">
            {currentRating > 0 ? `Your rating: ${currentRating}/5` : "Click to rate"}
          </span>
        )}
      </div>

      {averageRating !== undefined && averageRating !== null && (
        <div className="text-sm text-gray-600">
          Average: {averageRating.toFixed(1)}/5 ({ratingCount} rating{ratingCount !== 1 ? "s" : ""})
        </div>
      )}
    </div>
  );
}