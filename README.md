# Search Filter Browser Extension

A browser extension that automatically excludes unwanted search results from Google and DuckDuckGo searches.

## Features

- **Predefined News Sources**: Easily exclude major news websites from search results
- **Custom Filters**: Add your own custom search terms to exclude
- **Toggle Controls**: Enable/disable individual filters or all filters at once
- **Real-time Updates**: Search results are filtered automatically as you search
- **Cross-browser Support**: Works on both Firefox and Chrome-based browsers

## Supported News Sources

The extension comes with predefined filters for major news websites:
- Al Jazeera
- Associated Press
- BBC News
- Bloomberg
- CBS News
- CNN
- Fox News
- The Independent
- NBC News
- The New York Times
- Reuters
- Sky News
- The Guardian
- USA Today
- The Washington Post
- The Wall Street Journal

## Installation

### Firefox
1. Download this repository to your computer
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the downloaded repository

### Chrome/Edge/Brave
1. Download this repository to your computer
2. Open your browser and navigate to `chrome://extensions`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the downloaded repository folder

## Usage

1. Click the extension icon in your browser toolbar to open the popup
2. Use the main toggle to enable/disable the extension
3. Check/uncheck predefined news sources to exclude/include them from search results
4. Add custom search terms to exclude:
   - Enter the term in the input field
   - Click "Add" or press Enter
   - Use the checkbox to enable/disable the custom filter
5. Use the "Toggle All" switches to enable/disable all predefined or custom filters at once

## How It Works

The extension modifies your search queries by adding exclusion terms (using the `-` operator) to automatically filter out unwanted results. For example, if you exclude "cnn.com", your search query will automatically include "-cnn.com" to filter out results from that domain.

## Development

### Project Structure
```
search-filter-extension/
├── manifest.json      # Extension configuration
├── popup.html        # Extension popup interface
├── css/             # Stylesheets
├── js/
│   ├── popup.js     # Popup interface logic
│   └── content.js   # Content script for search page modification
└── icons/           # Extension icons
```

### Building from Source
1. Clone the repository
2. Make your changes
3. Load the extension in developer mode as described in the installation section

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues or have suggestions for improvements, please open an issue on the repository.
