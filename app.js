var budgetController = (function() {
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calcPercentage = function(totalIncome) {
        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentage = function() {
        return this.percentage;
    }

    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0   
        },
        budget: 0,
        percentage: -1
    };

    var calculateTotal = function(type) {
        var sum = 0;

        data.allItems[type].forEach(function(cur, i, arr) {
            sum += cur.value;
        });
        data.totals[type] = sum;
    }

    return {
        addItem: function(type, des, val) {
            var newItem, ID;

            // Create new ID
            if (data.allItems[type].length === 0) {
                ID = 0;
            } else {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            }
            // Create item following the type -> inc or exp
            if (type === 'exp') {
                newItem = new Expense(ID, des, val);
            } else { // type === 'inc'
                newItem = new Income(ID, des, val);
            }
            // Push the item into the data structure
            data.allItems[type].push(newItem);
            return newItem;
        },
        deleteItem: function(type, ID) {
            var ids, index;

            // create a new array which will contain only the id of each element
            ids = data.allItems[type].map(function(cur) {
                return cur.id; 
            });
            // get the index of the element associated with the ID
            index = ids.indexOf(ID);
            if (index !== -1) { // if we found the ID
                // delete the item at the index
                data.allItems[type].splice(index, 1);
            }
        },
        calculateBudget: function() {
            // Calculate total income and expenses
            calculateTotal('exp');
            calculateTotal('inc');
            // Calculate the budget: income - expenses
            data.budget = data.totals.inc - data.totals.exp;
            // Calculate the percentage of income that we spent
            if (data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            }
        },
        calculatePercentages: function() {
            data.allItems.exp.forEach(function(cur) {
                cur.calcPercentage(data.totals.inc);
            });
        },
        getPercentages: function() {
            var allPercentages = data.allItems.exp.map(function(cur) {
                return cur.getPercentage();
            });

            return allPercentages;
        },
        getBudget: function() {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            }
        },
        itemAboutSearch: function(search) {
            var income, expenses;

            var income = data.allItems.inc.filter(function(cur) {
                if (search != "" && cur.description.toLowerCase().includes(search)){
                    return true;
                }
                return false;
            }).map(function(cur) {
                return cur;
            });

            var expenses = data.allItems.exp.filter(function(cur) {
                if (search != "" && cur.description.toLowerCase().includes(search)){
                    return true;
                }
                return false;
            }).map(function(cur) {
                return cur;
            });

            return {
                inc: income,
                exp: expenses
            }
        },
        clearSearchResult: function() {
            document.querySelector(DOMstring.searchInput).value = "";
        },
        debug: function() {
            console.log(data);
        }
    }
})();

var UIController = (function() {
    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        btnAdd: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expensesLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month',
        searchInput: '.search__input',
        searchResult: '.search__result',
        incomeSearchContainer: '.income__list--search',
        expensesSearchContainer: '.expenses__list--search',
        btnClearSearch: '.search__icon--clear'
    };

    var formatNumber = function(num, type) {
        var numSplit, int, dec, separation;
        /*
        + or - before number
        exactly 2 decimal points
        comma separating the thousands
        */
        num = Math.abs(num);
        // round to 2 decimal points and convert to string
        num = num.toFixed(2);
        numSplit = num.split('.');
        // integer part
        int = numSplit[0];
        // decimal part
        dec = numSplit[1];
        if (int.length > 3) {
            separation = int.length - 3;
            int = int.substr(0, separation) + ',' + int.substr(separation, int.length);
        }

        return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;
    };

    var nodeListForEach = function(list, callback) {
        for (var i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    return {
        getInputs: function() {
            return {
                type: document.querySelector(DOMstrings.inputType).value, // Will be either inc or exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            };
        },
        getSearchInput: function() {
            return document.querySelector(DOMstrings.searchInput).value;
        },
        addListItem: function(item, type) {
            var html, preparedHtml, element;

            // create HTML string with placeholder text
            if (type === 'inc') {
                element = DOMstrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else {
                element = DOMstrings.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }
            // replace placeholder text with some actual data
            preparedHtml = html.replace('%id%', item.id);
            preparedHtml = preparedHtml.replace('%description%', item.description);
            preparedHtml = preparedHtml.replace('%value%', formatNumber(item.value, type));
            // insert the HTML into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend', preparedHtml);
        },
        deleteListItem: function(selectorID) {
            var el = document.getElementById(selectorID);

            el.parentNode.removeChild(el);
        },
        clearFields: function() {
            var fields, fieldsArray;

            // select the input fields
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
            // transform the querySelectorAll, that is a list, into an Array, using the slice method from the Array prototype
            var fieldsArray = Array.prototype.slice.call(fields);
            // loop into the array and clear the value of each element
            fieldsArray.forEach(function(current, index, array) {
                current.value = '';
            })
            // set the focus on the description field
            fieldsArray[0].focus();
        },
        displayBudget: function(budget) {
            var type;

            budget.budget >= 0 ? type = 'inc' : type = 'exp';

            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(budget.budget, type) + ' €';
            document.querySelector(DOMstrings.incomeLabel).textContent = budget.totalInc;
            document.querySelector(DOMstrings.expensesLabel).textContent = budget.totalExp;
            if (budget.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = budget.percentage + '%';
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '---';
            }
        },
        displayPercentages: function(percentages) {
            var labels = document.querySelectorAll(DOMstrings.expensesPercLabel);

            nodeListForEach(labels, function(current, index) {
                if (percentages[index] > 0) {
                    current.textContent = percentages[index] + '%';
                } else {
                    current.textContent = '---';
                }
            });
        },
        displayMonth: function() {
            var now, months, month ,year;
            
            now = new Date(); // Date(year, month, day) -> month should be the month number - 1
            months = [
                'January',
                'February',
                'March',
                'April',
                'May',
                'June',
                'July',
                'August',
                'September',
                'October',
                'November',
                'December',
            ]
            month = now.getMonth();
            year = now.getFullYear();

            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;
        },
        changedType: function() {
            var fields = document.querySelectorAll(
                DOMstrings.inputType + ',' +
                DOMstrings.inputDescription + ',' +
                DOMstrings.inputValue);

            nodeListForEach(fields, function(cur) {
                cur.classList.toggle('red-focus');
            });

            document.querySelector(DOMstrings.btnAdd).classList.toggle('red');
        },
        showSearchResult: function() {
            document.querySelector(DOMstrings.searchResult).classList.remove('hide');
        },
        hideSearchResult: function() {
            document.querySelector(DOMstrings.searchResult).classList.add('hide');
        },
        showBtnClear: function() {
            document.querySelector(DOMstrings.btnClearSearch).classList.remove('hide');
        },
        hideBtnClear: function() {
            document.querySelector(DOMstrings.btnClearSearch).classList.add('hide');
        },
        clearSearchInput: function() {
            document.querySelector(DOMstrings.searchInput).value = "";
        },
        clearSearchResult: function() {
            var listInc, listExp;
            
            listInc = document.querySelector(DOMstrings.incomeSearchContainer);
            while (listInc.firstChild) {
                listInc.removeChild(listInc.firstChild);
            }

            listExp = document.querySelector(DOMstrings.expensesSearchContainer);
            while (listExp.firstChild) {
                listExp.removeChild(listExp.firstChild);
            }
        },
        addSearchedItem: function(items) {
            var html, preparedHtml;

            html = '<div class="item clearfix"><div class="item__description">%description%</div><div class="item__value--search">%value%</div></div>';

            items.inc.map(function(item) {
                preparedHtml = html;
                preparedHtml = html.replace('%description%', item.description);
                preparedHtml = preparedHtml.replace('%value%', formatNumber(item.value, 'inc'));
                document.querySelector(DOMstrings.incomeSearchContainer).insertAdjacentHTML('beforeend', preparedHtml);
            });

            items.exp.map(function(item) {
                preparedHtml = html;
                preparedHtml = html.replace('%description%', item.description);
                preparedHtml = preparedHtml.replace('%value%', formatNumber(item.value, 'exp'));
                document.querySelector(DOMstrings.expensesSearchContainer).insertAdjacentHTML('beforeend', preparedHtml);
            });
        },
        getDOMstrings: function() {
            return DOMstrings;
        }
    };
})();

var controller = (function(budgetCtrl, UICtrl) {
    var setupEventListeners = function() {
        var DOM = UICtrl.getDOMstrings();

        document.querySelector(DOM.btnAdd).addEventListener('click', ctrlAddItem);

        document.addEventListener('keypress', function(e) {
            if (e.keyCode === 13 || e.which === 13) { // if the browser doesn't have the keyCode property
                ctrlAddItem();
            }
        });

        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);

        document.querySelector(DOM.searchInput).addEventListener('input', search);

        document.querySelector(DOM.btnClearSearch).addEventListener('click', function() {
            UICtrl.clearSearchInput();
            UICtrl.hideSearchResult();
            UICtrl.hideBtnClear();
        });
    };

    var updateBudget = function () {
        var budget;
        // 1. Calculate the bugdet
        budgetCtrl.calculateBudget();
        // 2. Return the budget
        budget = budgetCtrl.getBudget();
        // 3. Display the budget on the UI
        UICtrl.displayBudget(budget);
    };

    var updatePercentages = function() {
        var allPercentages;
        // 1. calculate percentages
        budgetCtrl.calculatePercentages();
        // 2. return percentages fro mthe budget controller
        percentages = budgetCtrl.getPercentages();
        // 3. update the UI with the new percentages
        UICtrl.displayPercentages(percentages);
    };

    var ctrlAddItem = function() {
        var inputs, newItem;
        // 1. Get the field input data
        inputs = UICtrl.getInputs();
        // Check if inputs value are correct
        if (inputs.description !== "" && !isNaN(inputs.value) && inputs.value > 0) {
            // 2. Add the item to the bugdet controller
            newItem = budgetCtrl.addItem(inputs.type, inputs.description, inputs.value)
            // 3. Add the item to the UI
            UICtrl.addListItem(newItem, inputs.type);
            // 4. Clear the fields
            UICtrl.clearFields();
            // 5. Calculate and update budget
            updateBudget();
            // 6. Calculate and update percentages
            updatePercentages();
        }
    };

    var ctrlDeleteItem = function(e) {
        var itemID, splitID, type, ID;
        //               i > button > .item__delete > .right > .item 
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
        if (itemID) {
            // remember: this ID is either inc-N or exp-N
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseInt(splitID[1]);
            // 1. delete the item from the data structure
            budgetCtrl.deleteItem(type, ID);
            // 2. delete the item from the UI
            UICtrl.deleteListItem(itemID);
            // 3. update and show the new budget
            updateBudget();
            // 4. Calculate and update percentages
            updatePercentages();
        }
    };

    var search = function() {
        var inputValue, results;

        // 1. Get input value
        inputValue = UICtrl.getSearchInput();
        if (inputValue != "") {
            UICtrl.showBtnClear();
        } else {
            UICtrl.hideBtnClear();
        }
        // 2. Search in all items 
        results = budgetCtrl.itemAboutSearch(inputValue.toLowerCase());

        // 3. Display values
        if (results.inc.length != 0 || results.exp.length != 0) {
            UICtrl.clearSearchResult();
            UICtrl.showSearchResult();
            UICtrl.addSearchedItem(results);
        } else {
            UICtrl.hideSearchResult();
        }

    }

    return {
        init: function() {
            console.log('Application has started.');
            UICtrl.displayMonth();
            UICtrl.displayBudget({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentage: 0
            });
            setupEventListeners();
        }
    }

})(budgetController, UIController);

controller.init();