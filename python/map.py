import geopandas as gpd
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors
import math
import csv

# Load the world map data
world = gpd.read_file(gpd.datasets.get_path('naturalearth_lowres'))

print(world['name'])
# Ensure every country gets a unique shade of green
def generate_shades_of_green(num_colors):
    colors = []
    for i in range(num_colors):
        # Generate a shade of green in the format (R, G, B) normalized to 0-1 range
        green_value = i/255
        colors.append((0, green_value, 0))
    return colors


# Get the number of countries
num_countries = world.shape[0]
print(num_countries)

# Generate unique shades of green
colors = generate_shades_of_green(num_countries)

# Create a color map dictionary
color_map = {}
for i, country in enumerate(world['name']):
    color_map[country] = colors[i]

# Plot the map
fig, ax = plt.subplots(1, 1, figsize=(15, 10))
edge_color = '#00B100'
world.plot(ax=ax, color=[mcolors.to_rgba(color_map[country]) for country in world['name']], edgecolor="none", antialiased=False)

# Remove axis for better presentation
ax.axis('off')

# Save the figure without the legend
plt.savefig('world_map_shades_of_green.png', bbox_inches='tight')
plt.show()

# Output the legend to a CSV file
with open('country_green_shades.csv', mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(['Green Channel Value', 'Country Name'])
    for country, color in color_map.items():
        green_value = round(color[1] * 255)
        writer.writerow([green_value, country])
