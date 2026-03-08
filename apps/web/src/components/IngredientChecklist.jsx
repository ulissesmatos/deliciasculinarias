
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage.jsx';

const IngredientChecklist = ({ recipeId, ingredients }) => {
  const [checkedItems, setCheckedItems] = useState([]);
  const { t } = useLanguage();
  const storageKey = `recipe_${recipeId}_ingredients`;

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setCheckedItems(JSON.parse(saved));
      } catch (e) {
        setCheckedItems([]);
      }
    }
  }, [storageKey]);

  const handleToggle = (index) => {
    const newChecked = checkedItems.includes(index)
      ? checkedItems.filter(i => i !== index)
      : [...checkedItems, index];
    
    setCheckedItems(newChecked);
    localStorage.setItem(storageKey, JSON.stringify(newChecked));
  };

  const handleClearAll = () => {
    setCheckedItems([]);
    localStorage.removeItem(storageKey);
  };

  if (!ingredients || ingredients.length === 0) {
    return null;
  }

  const checkedCount = checkedItems.length;
  const totalCount = ingredients.length;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-gray-900">{t('recipes.ingredients')}</h3>
        <div className="flex items-center gap-4">
          <span className="text-sm font-semibold text-primary">
            {checkedCount}/{totalCount} {t('recipes.ready')}
          </span>
          {checkedCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleClearAll}
            >
              {t('recipes.clearAll')}
            </Button>
          )}
        </div>
      </div>
      <div className="space-y-3">
        {ingredients.map((ingredient, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Checkbox
              id={`ingredient-${index}`}
              checked={checkedItems.includes(index)}
              onCheckedChange={() => handleToggle(index)}
            />
            <label
              htmlFor={`ingredient-${index}`}
              className={`flex-1 cursor-pointer transition-all ${
                checkedItems.includes(index) 
                  ? 'line-through text-gray-400' 
                  : 'text-gray-700'
              }`}
            >
              {typeof ingredient === 'string' ? ingredient : ingredient.name || ingredient.item}
            </label>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default IngredientChecklist;
