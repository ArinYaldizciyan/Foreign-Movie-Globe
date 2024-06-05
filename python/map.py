import geopandas as gpd
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
from shapely.geometry import Polygon

# Load the world map data
world = gpd.read_file(gpd.datasets.get_path('naturalearth_lowres'))

# Ensure every country gets a unique shade of green
def generate_shades_of_green(num_colors):
    colors = []
    for i in range(num_colors):
        # Generate a shade of green in the format (R, G, B)
        green_value = int(255 * (i / (num_colors - 1)))
        colors.append((0, green_value, 0))
    return colors

# Get the number of countries
num_countries = world.shape[0]

# Generate unique shades of green
colors = generate_shades_of_green(min(255, num_countries))

# Create a color map dictionary
color_map = {}
for i, country in enumerate(world['name']):
    color_map[country] = colors[i % len(colors)]

# Plot the map
fig, ax = plt.subplots(1, 1, figsize=(15, 10))
world.plot(ax=ax, color=[mcolors.to_rgba(mcolors.rgb2hex(color_map[country])) for country in world['name']], edgecolor='black')

# Create a legend
handles = [plt.Line2D([0], [0], marker='o', color='w', label=country, markersize=10, markerfacecolor=mcolors.to_rgba(mcolors.rgb2hex(color_map[country]))) for country in world['name']]
ax.legend(handles=handles, bbox_to_anchor=(1.05, 1), loc='upper left', fontsize='small')

# Remove axis for better presentation
ax.axis('off')

# Save the figure
plt.savefig('world_map_shades_of_green.png', bbox_inches='tight')
plt.show()
