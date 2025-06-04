from flask import Flask, render_template, request, jsonify, redirect, url_for, flash, send_from_directory, session
import json
import os
import base64
import requests
from datetime import datetime
import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user

app = Flask(__name__, static_url_path='', static_folder='static')
app.secret_key = os.getenv('SECRET_KEY', 'your-secret-key-here')  # Add this to .env file

# Global variable to store product names
product_names = set()

# GitHub API configuration
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')  # Get from environment variable
REPO_OWNER = 'Divine0-3'  # Replace with your username
REPO_NAME = 'pearl-site'  # Replace with your repository name
FILE_PATH = 'data.json'

# Load environment variables
load_dotenv()

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'admin_login'

class AdminUser(UserMixin):
    def __init__(self, id):
        self.id = id

@login_manager.user_loader
def load_user(user_id):
    return AdminUser(user_id)

@app.route('/')
def home():
    content, _ = get_github_file_content()
    return render_template('index.html', 
                         products=content['products'] if content else [],
                         categories=content['categories'] if content else [],
                         offers=content['offers'] if content else [],
                         occasions=content['occasions'] if content else [])

@app.route('/about')
def about():
    content, _ = get_github_file_content()
    return render_template('about.html', categories=content.get('categories', []) if content else [])

@app.route('/contact')
def contact():
    content, _ = get_github_file_content()
    return render_template('contact.html', categories=content.get('categories', []) if content else [])

@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        password = request.form.get('password')
        if password == os.getenv('ADMIN_PASSWORD'):
            user = AdminUser(1)
            login_user(user)
            return redirect(url_for('admin'))
        flash('Invalid password')
    return render_template('admin_login.html')

@app.route('/admin/logout')
@login_required
def admin_logout():
    logout_user()
    return redirect(url_for('admin_login'))

@app.route('/admin')
@login_required
def admin():
    content, _ = get_github_file_content()
    return render_template('admin.html', 
                         products=content['products'] if content else [],
                         categories=content['categories'] if content else [],
                         offers=content['offers'] if content else [],
                         occasions=content['occasions'] if content else [])

@app.route('/product/<int:product_id>')
def product_detail(product_id):
    content, _ = get_github_file_content()
    if content is None:
        return redirect(url_for('home'))
    
    product = next((p for p in content['products'] if p['id'] == product_id), None)
    if product is None:
        return redirect(url_for('home'))
    
    return render_template('pearl-detail.html', 
                         product=product, 
                         categories=content.get('categories', []))

@app.route('/api/products', methods=['GET'])
def get_products():
    content, _ = get_github_file_content()
    if content is None:
        return jsonify({'error': 'Failed to load data'}), 500
    return jsonify(content['products'])

@app.route('/api/products', methods=['POST'])
def add_product():
    content, sha = get_github_file_content()
    if content is None:
        return jsonify({'error': 'Failed to load data'}), 500

    try:
        # Map the color value to the full precious set name
        precious_set_map = {
            'white': 'Freshwater White Pearls',
            'black': 'Freshwater Black Pearls',
            'rare': 'Rarest Pearls',
            'gemstones': 'Precious Gemstones',
            'south-pacific': 'South Pacific Shell Pearls'
        }

        color_value = request.form.get('color')
        precious_set = precious_set_map.get(color_value, color_value)

        new_product = {
            'id': int(datetime.now().timestamp()),
            'name': request.form['name'],
            'price': int(float(request.form['price'])),  # Round to integer
            'category': request.form['category'],
            'description': request.form['description'],
            'image': request.form['image'],
            'precious_set': precious_set,  # Store the full precious set name
            'added_date': datetime.now().strftime('%Y-%m-%d')
        }

        # Add discount percentage if provided
        if 'hasDiscount' in request.form and request.form['hasDiscount'] == 'on':
            new_product['discountPercentage'] = int(request.form['discountPercentage'])

        content['products'].append(new_product)
        update_product_names(content)  # Update the product names set

        if update_github_file(content, sha):
            return jsonify({'message': 'Product added successfully', 'product': new_product})
        else:
            return jsonify({'error': 'Failed to update data'}), 500

    except Exception as e:
        print(f"Error adding product: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
def delete_product(product_id):
    content, sha = get_github_file_content()
    if content is None:
        return jsonify({'error': 'Failed to load data'}), 500

    try:
        # Check if product exists
        if not any(p['id'] == product_id for p in content['products']):
            return jsonify({'error': 'Product not found'}), 404

        # Remove the product
        content['products'] = [p for p in content['products'] if p['id'] != product_id]
        update_product_names(content)  # Update the product names set

        if update_github_file(content, sha):
            return jsonify({'message': 'Product deleted successfully'})
        else:
            return jsonify({'error': 'Failed to update data'}), 500

    except Exception as e:
        print(f"Error deleting product: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/categories', methods=['GET'])
def get_categories():
    content, _ = get_github_file_content()
    if content is None:
        return jsonify({'error': 'Failed to load data'}), 500
    return jsonify(content['categories'])

@app.route('/api/categories', methods=['POST'])
def add_category():
    content, sha = get_github_file_content()
    if content is None:
        return jsonify({'error': 'Failed to load data'}), 500

    try:
        new_category = {
            'id': int(datetime.now().timestamp()),
            'name': request.form['categoryName']
        }

        content['categories'].append(new_category)

        if update_github_file(content, sha):
            return jsonify({'message': 'Category added successfully', 'category': new_category})
        else:
            return jsonify({'error': 'Failed to update data'}), 500

    except Exception as e:
        print(f"Error adding category: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/categories/<int:category_id>', methods=['DELETE'])
def delete_category(category_id):
    content, sha = get_github_file_content()
    if content is None:
        return jsonify({'error': 'Failed to load data'}), 500

    try:
        # Check if category exists
        if not any(c['id'] == category_id for c in content['categories']):
            return jsonify({'error': 'Category not found'}), 404

        # Remove the category
        content['categories'] = [c for c in content['categories'] if c['id'] != category_id]

        if update_github_file(content, sha):
            return jsonify({'message': 'Category deleted successfully'})
        else:
            return jsonify({'error': 'Failed to update data'}), 500

    except Exception as e:
        print(f"Error deleting category: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/offers', methods=['GET'])
def get_offers():
    content, _ = get_github_file_content()
    if content is None:
        return jsonify({'error': 'Failed to load data'}), 500
    return jsonify(content['offers'])

@app.route('/api/offers', methods=['POST'])
def add_offer():
    content, sha = get_github_file_content()
    if content is None:
        return jsonify({'error': 'Failed to load data'}), 500

    try:
        # Get the image URL from either Cloudinary upload or manual URL input
        image_url = request.form.get('image') or request.form.get('offerImageUrl')
        if not image_url:
            return jsonify({'error': 'Image is required'}), 400

        new_offer = {
            'id': int(datetime.now().timestamp()),
            'title': request.form['offerTitle'],
            'tagline': request.form['offerTagline'],
            'tag': request.form.get('offerTag', ''),
            'image': image_url,
            'products': []
        }

        # Add discount percentage only if provided
        if 'hasDiscount' in request.form and request.form['hasDiscount'] == 'on':
            new_offer['discountPercentage'] = int(request.form['discountPercentage'])

        # Add selected products if provided
        if 'products' in request.form:
            try:
                products = json.loads(request.form['products'])
                # Verify that all product IDs exist in the products list
                valid_products = []
                for product_id in products:
                    if any(p['id'] == product_id for p in content['products']):
                        valid_products.append(product_id)
                if valid_products:
                    new_offer['products'] = valid_products
            except json.JSONDecodeError:
                return jsonify({'error': 'Invalid products data'}), 400

        content['offers'].append(new_offer)

        if update_github_file(content, sha):
            return jsonify({'message': 'Offer added successfully', 'offer': new_offer})
        else:
            return jsonify({'error': 'Failed to update data'}), 500

    except Exception as e:
        print(f"Error adding offer: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/offers/<int:offer_id>', methods=['DELETE'])
def delete_offer(offer_id):
    content, sha = get_github_file_content()
    if content is None:
        return jsonify({'error': 'Failed to load data'}), 500

    try:
        # Check if offer exists
        if not any(o['id'] == offer_id for o in content['offers']):
            return jsonify({'error': 'Offer not found'}), 404

        # Remove the offer
        content['offers'] = [o for o in content['offers'] if o['id'] != offer_id]

        if update_github_file(content, sha):
            return jsonify({'message': 'Offer deleted successfully'})
        else:
            return jsonify({'error': 'Failed to update data'}), 500

    except Exception as e:
        print(f"Error deleting offer: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/occasions', methods=['GET'])
def get_occasions():
    content, _ = get_github_file_content()
    if content is None:
        return jsonify({'error': 'Failed to load data'}), 500
    return jsonify(content['occasions'])

@app.route('/api/occasions', methods=['POST'])
def add_occasion():
    content, sha = get_github_file_content()
    if content is None:
        return jsonify({'error': 'Failed to load data'}), 500

    try:
        # Get the image URL from either Cloudinary upload or manual URL input
        image_url = request.form.get('image') or request.form.get('occasionImageUrl')
        if not image_url:
            return jsonify({'error': 'Image is required'}), 400
        
        new_occasion = {
            'id': int(datetime.now().timestamp()),
            'name': request.form['occasionName'],
            'tagline': request.form['occasionTagline'],
            'image': image_url,
            'products': []
        }

        # Add selected products if provided
        if 'products' in request.form:
            try:
                products = json.loads(request.form['products'])
                # Verify that all product IDs exist in the products list
                valid_products = []
                for product_id in products:
                    if any(p['id'] == product_id for p in content['products']):
                        valid_products.append(product_id)
                if valid_products:
                    new_occasion['products'] = valid_products
            except json.JSONDecodeError:
                return jsonify({'error': 'Invalid products data'}), 400

        content['occasions'].append(new_occasion)

        if update_github_file(content, sha):
            return jsonify({'message': 'Occasion added successfully', 'occasion': new_occasion})
        else:
            return jsonify({'error': 'Failed to update data'}), 500

    except Exception as e:
        print(f"Error adding occasion: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/api/occasions/<int:occasion_id>', methods=['DELETE'])
def delete_occasion(occasion_id):
    content, sha = get_github_file_content()
    if content is None:
        return jsonify({'error': 'Failed to load data'}), 500

    try:
        # Check if occasion exists
        if not any(o['id'] == occasion_id for o in content['occasions']):
            return jsonify({'error': 'Occasion not found'}), 404

        # Remove the occasion
        content['occasions'] = [o for o in content['occasions'] if o['id'] != occasion_id]

        if update_github_file(content, sha):
            return jsonify({'message': 'Occasion deleted successfully'})
        else:
            return jsonify({'error': 'Failed to update data'}), 500

    except Exception as e:
        print(f"Error deleting occasion: {str(e)}")
        return jsonify({'error': str(e)}), 400

@app.route('/offer/<int:offer_id>')
def offer_products(offer_id):
    content, _ = get_github_file_content()
    if content is None:
        return redirect(url_for('home'))
    
    offer = next((o for o in content['offers'] if o['id'] == offer_id), None)
    if offer is None:
        return redirect(url_for('home'))
    
    # Get products for this offer
    products = [p for p in content['products'] if p['id'] in offer.get('products', [])]
    
    return render_template('offer-products.html', 
                         offer=offer, 
                         products=products,
                         categories=content.get('categories', []))

@app.route('/occasion/<int:occasion_id>')
def occasion_products(occasion_id):
    content, _ = get_github_file_content()
    if content is None:
        return redirect(url_for('home'))
    
    occasion = next((o for o in content['occasions'] if o['id'] == occasion_id), None)
    if occasion is None:
        return redirect(url_for('home'))
    
    # Get products for this occasion
    products = [p for p in content['products'] if p['id'] in occasion.get('products', [])]
    
    return render_template('offer-products.html', 
                         offer=occasion, 
                         products=products,
                         categories=content.get('categories', []))

@app.route('/products/color/<string:color_name>')
def products_by_color(color_name):
    content, _ = get_github_file_content()
    if content is None:
        return redirect(url_for('home'))

    all_products = content.get('products', [])
    
    # Define color-specific details
    color_details = {
        'rare': {
            'title': 'Rarest Pearls',
            'tagline': 'Explore all our rarest collections, add a spoonful of blue ocean in your jwellery box',
            'bg_color': 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)'  # Deep blue gradient
        },
        'black': {
            'title': 'Black Pearls',
            'tagline': 'Explore our rare black pearl collection, let dark pearls spark around your neck.',
            'bg_color': 'linear-gradient(135deg, #212121 0%, #424242 100%)'  # Elegant dark gradient
        },
        'white': {
            'title': 'Freshwater White Pearls',
            'tagline': 'Explore our freshwater, Tahitian & south sea white pearls sets. Listen to the mysterious ocean tales.',
            'bg_color': 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)'  # Soft blue-white gradient
        },
        'gemstones': {
            'title': 'Gemstones',
            'tagline': 'Explore our 80+ varieties of precious & semi percious gemstones. A set that is crafted by mother nature.',
            'bg_color': 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)'  # Rich purple gradient
        },
        'south-pacific': {
            'title': 'South Pacific Shell Pearls',
            'tagline': 'Explore a huge range of South Pacific Shell Pearls\n(Description - Shell pearls are made by grinding particular oyster shells, shaping and coating them)',
            'bg_color': 'linear-gradient(135deg, #006064 0%, #00838f 100%)'  # Ocean teal gradient
        }
    }
    
    if color_name.lower() == 'all':
        filtered_products = all_products
        page_details = {
            'title': 'All Pearls',
            'tagline': 'Explore our complete collection of beautiful pearls.',
            'bg_color': 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)'  # Neutral light gradient
        }
    else:
        # Map the color_name to the corresponding precious set name
        precious_set_map = {
            'white': 'Freshwater White Pearls',
            'black': 'Freshwater Black Pearls',
            'rare': 'Rarest Pearls',
            'gemstones': 'Precious Gemstones',
            'south-pacific': 'South Pacific Shell Pearls'
        }
        
        precious_set = precious_set_map.get(color_name.lower())
        # Filter products where the 'precious_set' attribute matches
        filtered_products = [p for p in all_products if p.get('precious_set', '') == precious_set]
        
        page_details = color_details.get(color_name.lower(), {
            'title': f'{color_name.capitalize()} Pearls',
            'tagline': f'Explore our beautiful {color_name.capitalize()} Pearls collection.',
            'bg_color': 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)'  # Default neutral gradient
        })

    return render_template('offer-products.html', 
                         offer=page_details, 
                         products=filtered_products,
                         categories=content.get('categories', []))

@app.route('/category/<string:category_name>')
def products_by_category(category_name):
    content, _ = get_github_file_content()
    if content is None:
        return redirect(url_for('home'))

    # Convert category name back to original format (replace hyphens with spaces and capitalize)
    formatted_category = category_name.replace('-', ' ').title()
    
    # Filter products by category
    filtered_products = [
        product for product in content.get('products', [])
        if product.get('category', '').lower() == formatted_category.lower()
    ]

    # Create page details for the template
    page_details = {
        'title': formatted_category,
        'image': '',  # You can add a category-specific image if needed
        'tagline': f'Explore our beautiful {formatted_category} collection.',
        'category': formatted_category
    }

    return render_template('offer-products.html', 
                         offer=page_details, 
                         products=filtered_products,
                         categories=content.get('categories', []))

@app.route('/search-suggestions')
def search_suggestions():
    query = request.args.get('q', '').strip().lower()
    if len(query) < 2:
        return jsonify([])
    
    # Get content from GitHub
    content, _ = get_github_file_content()
    if content is None:
        return jsonify([])
    
    # Find matching products
    matching_products = [
        product for product in content.get('products', [])
        if query in product['name'].lower()
    ][:5]  # Limit to 5 results
    
    # Format the results
    suggestions = [{
        'id': product['id'],
        'name': product['name'],
        'category': product.get('category', '')
    } for product in matching_products]
    
    return jsonify(suggestions)

@app.route('/new-products')
def new_products():
    content, _ = get_github_file_content()
    if content is None:
        return redirect(url_for('home'))

    # Get current date
    current_date = datetime.now()
    current_month = current_date.strftime('%Y-%m')
    
    # Get previous month
    if current_date.month == 1:
        previous_month = f"{current_date.year - 1}-12"
    else:
        previous_month = f"{current_date.year}-{current_date.month - 1:02d}"

    # Filter products by added_date
    current_month_products = [
        product for product in content.get('products', [])
        if product.get('added_date', '').startswith(current_month)
    ]

    # If no products in current month, show previous month's products
    if not current_month_products:
        products = [
            product for product in content.get('products', [])
            if product.get('added_date', '').startswith(previous_month)
        ]
        month_display = datetime.strptime(previous_month, '%Y-%m').strftime('%B %Y')
    else:
        products = current_month_products
        month_display = current_date.strftime('%B %Y')

    # Create page details for the template
    page_details = {
        'title': f'New Products - {month_display}',
        'image': '',  # You can add a specific image for new products if needed
        'tagline': f'Explore our latest additions from {month_display}',
        'category': 'New Products'
    }

    return render_template('offer-products.html', 
                         offer=page_details, 
                         products=products,
                         categories=content.get('categories', []))

@app.route('/upload-image', methods=['POST'])
def upload_image():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400
    
    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(file)
        return jsonify({'url': result['secure_url']})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/search', methods=['GET'])
def search():
    query = request.args.get('q', '').strip().lower()
    content, _ = get_github_file_content()
    
    if content is None:
        return redirect(url_for('home'))
    
    # Find matching products
    matching_products = [
        product for product in content.get('products', [])
        if query in product['name'].lower() or query in product.get('category', '').lower()
    ]
    
    return render_template('search.html', 
                         query=query,
                         products=matching_products,
                         categories=content.get('categories', []))

def update_product_names(content):
    """Update the global product names set with current products."""
    global product_names
    product_names = {product['name'].lower() for product in content.get('products', [])}

def get_github_file_content():
    """Fetch file content from GitHub."""
    if not all([GITHUB_TOKEN, REPO_OWNER, REPO_NAME]):
        return None, None

    try:
        headers = {
            'Authorization': f'token {GITHUB_TOKEN}',
            'Accept': 'application/vnd.github.v3+json'
        }
        url = f'https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/contents/{FILE_PATH}'
        response = requests.get(url, headers=headers)
        
        if response.status_code == 404:
            # File doesn't exist, create initial structure
            initial_content = {
                'products': [],
                'categories': [],
                'offers': [],
                'occasions': [],
                'updated_by': 'admin',
                'updated_at': datetime.now().isoformat()
            }
            update_product_names(initial_content)
            return initial_content, None
        
        if response.status_code != 200:
            raise Exception(f'GitHub API error: {response.status_code}')

        data = response.json()
        content = base64.b64decode(data['content']).decode('utf-8')
        content_json = json.loads(content)
        update_product_names(content_json)
        return content_json, data['sha']
    except Exception as e:
        print(f"Error fetching file from GitHub: {str(e)}")
        return None, None

def update_github_file(content, sha):
    """Update file content on GitHub."""
    if not all([GITHUB_TOKEN, REPO_OWNER, REPO_NAME]):
        return False

    try:
        headers = {
            'Authorization': f'token {GITHUB_TOKEN}',
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        }
        url = f'https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/contents/{FILE_PATH}'
        
        # Add update metadata
        content['updated_by'] = 'admin'
        content['updated_at'] = datetime.now().isoformat()
        
        # Convert content to base64
        content_str = json.dumps(content, indent=2, ensure_ascii=False)
        content_bytes = content_str.encode('utf-8')
        content_b64 = base64.b64encode(content_bytes).decode('utf-8')

        data = {
            'message': 'Update products data',
            'content': content_b64,
            'sha': sha,
            'branch': 'master'  # Specify the master branch
        }

        response = requests.put(url, headers=headers, json=data)
        if response.status_code != 200:
            print(f"GitHub API error: {response.status_code}")
            print(f"Response: {response.text}")
        return response.status_code == 200
    except Exception as e:
        print(f"Error updating file on GitHub: {str(e)}")
        return False

if __name__ == '__main__':
    app.run(debug=True) 