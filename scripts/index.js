var emojis = [];
const getLastPageFromStorage = () => {
  const lastPage = parseInt(localStorage.getItem("lastPage") || "1");
  return lastPage;
};
var categories = [];
var groups = [];
var currentPage = getLastPageFromStorage();
var itemsPerPage = 10;
var emojiToDisplay = [];
var filteredEmojis = [];
var isFiltering = false;
var filterType = "";

const getEmojiFromAPI = async () => {
  try {
    const getEmojiApiResponse = await fetch(
      /* "/scripts/test.json"*/ "https://emojihub.yurace.pro/api/all"
    );

    // Check if the request was successful (status code between 200 and 299)
    if (getEmojiApiResponse.ok) {
      // If the response is JSON, you can access the data using .json()
      const responseData = await getEmojiApiResponse.json();
      emojis = responseData;
      const res = aggregateGroupsAndCategories(responseData);
      categories = res.categories;
      groups = res.groups;
    } else {
      // Handle errors if the request was not successful
      showToast("Error fetching data", false);
    }
  } catch (err) {
    showToast("Failed to fetch Emoji's", false);
  }
};

const showToast = (message, isSuccess) => {
  const toastContainer = document.getElementById("toast-container");
  const toastBackground = isSuccess ? "success" : "error";
  toastContainer.classList.add(`toast-active`);
  toastContainer.classList.add(toastBackground);
  document.getElementById("toast-content").innerText = message;
};
const updateFilterFields = () => {
  const groupsHtml = [];
  groups.map((group) => {
    groupsHtml.push(
      `<option value=${group.split(" ").join("-")}>${group}</option>`
    );
  });
  groupsHtml.unshift(`<option value="">Filter by Group</option>`);
  const categoriesHtml = [];
  categories.map((category) => {
    categoriesHtml.push(
      `<option value=${category.split(" ").join("-")}>${category}</option>`
    );
  });
  categoriesHtml.unshift(`<option value="">Filter by Category</option>`);
  updateInnerHtml("filter-category", categoriesHtml.join(""));
  updateInnerHtml("filter-groups", groupsHtml.join(""));
};
const closeToast = () => {
  document.getElementById("toast-container").classList.remove("toast-active");
};
const displayEmoji = async (page) => {
  if (emojis.length === 0) {
    await getEmojiFromAPI();
    updateFilterFields();
  }
  currentPage = page;
  localStorage.setItem("lastPage", page);
  if (isFiltering) {
    return handleFiltering();
  }
  emojiToDisplay = getArraySubsetForPage(emojis, page, itemsPerPage);
  renderEmojiToPage();
};
const handleFiltering = () => {
  if (filterType === "category") {
    return handleOnFilterCategoryChange();
  }
  if (filterType === "group") {
    return handleOnFilterGroupChange();
  }
};
const handleSearchEmojis = () => {
  const keyword = document.getElementById("filter-search").value;

  if (keyword === "") {
    isFiltering = "";
    filterType = "";
    displayEmoji(1);
    return;
  }
  if (!isFiltering || filterType != "search") {
    currentPage = 1;
  }
  const searches = searchEmojis(keyword);
  document.getElementById("filter-category").value = "";
  document.getElementById("filter-groups").value = "";
  filteredEmojis = searches;
  isFiltering = true;
  filterType = "search";
  emojiToDisplay = getArraySubsetForPage(
    searches,
    currentPage,
    itemsPerPage
  );
  renderEmojiToPage();
};
function searchEmojis(keyword) {
  const matchedEmojis = emojis.filter((emoji) => {
    // Check if the keyword is found in category, group, name, htmlCode, or unicode
    const lowerKeyword = keyword.toLowerCase();
    return (
      emoji.category.toLowerCase().includes(lowerKeyword) ||
      emoji.group.toLowerCase().includes(lowerKeyword) ||
      emoji.name.toLowerCase().includes(lowerKeyword) ||
      emoji.htmlCode.some((code) =>
        code.toLowerCase().includes(lowerKeyword)
      ) ||
      emoji.unicode.some((code) => code.toLowerCase().includes(lowerKeyword))
    );
  });

  return matchedEmojis;
}
const handleOnFilterGroupChange = () => {
  const keyword = document.getElementById("filter-groups").value;

  if (keyword === "") {
    isFiltering = "";
    filterType = "";
    displayEmoji(1);
    return;
  }
  if (!isFiltering || filterType != "group") {
    currentPage = 1;
  }

  const matchedEmojis = emojis.filter((emoji) => {
    // Check if the lowercase category name includes the lowercase keyword
    return (
      emoji.group.toLowerCase() === keyword.toLowerCase().split("-").join(" ")
    );
  });
  document.getElementById("filter-category").value = "";
  document.getElementById("filter-search").value = "";
  filteredEmojis = matchedEmojis;
  isFiltering = true;
  filterType = "group";
  emojiToDisplay = getArraySubsetForPage(
    matchedEmojis,
    currentPage,
    itemsPerPage
  );
  renderEmojiToPage();
};
const handleOnFilterCategoryChange = () => {
  const keyword = document.getElementById("filter-category").value;
  if (keyword === "") {
    isFiltering = "";
    filterType = "";
    displayEmoji(1);
    return;
  }
  if (!isFiltering || filterType != "category") {
    currentPage = 1;
  }
  document.getElementById("filter-groups").value = "";
  document.getElementById("filter-search").value = "";
  const matchedEmojis = emojis.filter((emoji) => {
    // Check if the lowercase category name includes the lowercase keyword
    return (
      emoji.category.toLowerCase() ===
      keyword.toLowerCase().split("-").join(" ")
    );
  });

  filteredEmojis = matchedEmojis;
  isFiltering = true;
  filterType = "category";
  emojiToDisplay = getArraySubsetForPage(
    matchedEmojis,
    currentPage,
    itemsPerPage
  );
  renderEmojiToPage();
};

displayEmoji(currentPage);
const updateInnerHtml = (elementID, htmlString) => {
  return (document.getElementById(elementID).innerHTML = htmlString);
};
const renderEmojiToPage = () => {
  // loops the array and updates inner html
  var htmlString = ``;
  emojiToDisplay.map((emoji) => {
    htmlString += `<div class="emoji-card">
                    <div class="emoji ${
                      emoji.htmlCode[0]
                    }">${emoji.htmlCode.join("")}</div>
                    <div class="details">
                    <p class="name">${emoji.name}</p>
                    <p class="category">${emoji.group}</p>
                    <p class="category">${emoji.category}</p>
                    </div>
                </div>`;
  });
  updateInnerHtml("emoji-container", htmlString);
};
const updatePaginated = (totalItems, page, itemsPerPage) => {
  if (totalItems === "0") {
    // Update pagination to empty
    updateInnerHtml("showingText", "No Items found");
  } else {
    const numberOfPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    updateInnerHtml(
      "showingText",
      `Showing ${
        startIndex === 0 ? "1" : startIndex
      } - ${endIndex} of ${totalItems} emojis`
    );
    handlePopulateSelectDropdown(numberOfPages);
    const pagesToGenerate = generateNumberArray(numberOfPages);
    handlePagination(pagesToGenerate, totalItems);
  }
};
const handleOnPageChange = () => {
  const selected = document.getElementById("select-page-dropdown").value;
  if (selected !== "0") {
    return displayEmoji(parseInt(selected));
  }
};
const handlePopulateSelectDropdown = (numberOfPages) => {
  const selectValues = [];
  selectValues.push(`<option value="0">Jump to Page</option>`);
  for (var i = 1; i < numberOfPages; i++) {
    selectValues.push(`<option value=${i}>${i}</option>`);
  }
  updateInnerHtml("select-page-dropdown", selectValues.join(""));
};
const handlePagination = (paginations, totalItems) => {
  const paginationContainer = document.getElementById("pagination");
  paginationContainer.innerHTML = ""; // Clear previous pagination

  const isCurrentPagePresent =
    paginations.indexOf(currentPage) !== -1 ? true : false;
  if (!isCurrentPagePresent) {
    paginations.push(currentPage);
  }
  if (currentPage + 1 > totalItems) paginations.push(currentPage + 1);
  if (currentPage + 2 > totalItems) paginations.push(currentPage + 2);
  if (currentPage - 1 > 0) paginations.push(currentPage - 1);
  if (currentPage - 2 > 0) paginations.push(currentPage - 2);
  paginations.sort((a, b) => a - b);
  paginations = paginations.filter(
    (number, index, array) => array.indexOf(number) === index
  );

  if (currentPage > 1) {
    paginationContainer.appendChild(createPageButton("«", currentPage - 1));
  }

  paginations.forEach((page) => {
    const button = createPageButton(page, page);
    if (page === currentPage) {
      button.classList.add("active");
    }
    paginationContainer.appendChild(button);
  });

  if (currentPage < totalItems) {
    paginationContainer.appendChild(createPageButton("»", currentPage + 1));
  }
};
const aggregateGroupsAndCategories = (emojis) => {
  const result = emojis.reduce(
    (accumulator, emoji) => {
      // Add the group name to the accumulator if it's not already present
      if (!accumulator.groups.includes(emoji.group)) {
        accumulator.groups.push(emoji.group);
      }
      // Add the category name to the accumulator if it's not already present
      if (!accumulator.categories.includes(emoji.category)) {
        accumulator.categories.push(emoji.category);
      }
      return accumulator;
    },
    { groups: [], categories: [] } // Initial accumulator object with empty arrays
  );

  return result;
};
function createPageButton(text, pageNumber) {
  const button = document.createElement("button");
  button.classList.add("pagination-item");
  button.innerText = text;
  button.addEventListener("click", () => handleNextPage(pageNumber));
  return button;
}
const handleOnPerPageChange = () => {
  const selected = document.getElementById("select-per-page-dropdown").value;
  if (selected !== "0") {
    itemsPerPage = parseInt(selected);
    return displayEmoji(1);
  }
};

const handleNextPage = (page) => {
  return displayEmoji(page);
};
const generateNumberArray = (number) => {
  if (number <= 10) {
    return Array.from({ length: number }, (_, i) => i + 1);
  } else {
    const lowestNumbers = [1, 2, 3, 4];
    const highestNumbers = [number - 3, number - 2, number - 1, number];
    return [...lowestNumbers, ...highestNumbers];
  }
};
const getArraySubsetForPage = (array, page, itemsPerPage) => {
  // Calculate the starting index of the desired page
  const startIndex = (page - 1) * itemsPerPage;

  // Calculate the ending index of the desired page
  const endIndex = startIndex + itemsPerPage;
  updatePaginated(array.length, page, itemsPerPage);
  // Return the subset of the array for the desired page using slice()
  return array.slice(startIndex, endIndex);
};
