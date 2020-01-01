const fs = require('fs');
const path = require('path');
const Multer = require('multer');
const express = require('express');
const bodyParser = require('body-parser');
const {
  addProduct,
  buyProduct,
  getProduct,
  getAccounts,
  unlockAccount,
  getAllProducts,
} = require('./blockchain');

// IMAGE UPLOADER SESSING
const upload = Multer({ dest: 'public/images/', limits: { files: 1 } });
const MAX_IMAGE_SIZE_BYTES = 10485760;

const app = express();
const appPort = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const bootstrapJS = express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js/bootstrap.min.js'));
const bootstrapCSS = express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css/bootstrap.min.css'));
const toastrCSS = express.static(path.join(__dirname, 'node_modules/toastr/build/toastr.min.css'));
const toastrJS = express.static(path.join(__dirname, 'node_modules/toastr/build/toastr.min.js'));
const jquery = express.static(path.join(__dirname, 'node_modules/jquery/dist/jquery.min.js'));
const holderjs = express.static(path.join(__dirname, 'node_modules/holderjs/holder.min.js'));

app.use('/js/jquery.min.js', jquery);
app.use('/js/holder.min.js', holderjs);
app.use('/js/bootstrap.min.js', bootstrapJS);
app.use('/css/bootstrap.min.css', bootstrapCSS);
app.use('/js/toastr.min.js', toastrJS);
app.use('/css/toastr.min.css', toastrCSS);
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', async (request, response, next) => {
  const accounts = await getAccounts();
  const products = await Promise.all((await getAllProducts()).map(pid => getProduct(pid)));
  return response.render('index', { accounts, products });
});

app.post('/products/add', upload.single('productImageInput'), async (request, response) => {
  try {
    const { productNameInput, productPriceInput, productQtyInput, productSeller, accountPassword } = request.body;
    const { file } = request;
    if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.mimetype)) {
      fs.unlinkSync(file.path);
      return response.json({
        success: false,
        error: 'Please upload a file as jpeg, png, or gif.',
      });
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      fs.unlinkSync(file.path);
      return response.json({
        success: false,
        error: 'Please upload smaller file. (10MB)',
      });
    }

    if (!productNameInput || !productPriceInput || !productQtyInput || !productSeller) {
      return response.json({
        success: false,
        error: 'Please fill the form.',
      });
    }

    if (!Number.isInteger(Number(productPriceInput))) {
      return response.json({
        success: false,
        error: 'Plese enter product price in number',
      });
    }

    if (!Number.isInteger(Number(productQtyInput))) {
      return response.json({
        success: false,
        error: 'Plese enter product quantity in number',
      });
    }

    const productImagePath = 'images/' + file.filename;
    const unlocked = await unlockAccount(productSeller, accountPassword);
    if (!unlocked) {
      return response.json({
        success: false,
        error: 'Please type correct account password.',
      });
    }
    const dataResult = await addProduct(productNameInput, productPriceInput, productQtyInput, productImagePath, productSeller);
    return response.json({
      success: true,
      data: { pid: dataResult.pid, transactionReceipt: dataResult.receipt },
      error: null,
    });
  } catch (error) {
    return response.json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/products/buy', async (request, response) => {
  try {
    const { pid, buyer, password } = request.body;
    if (!pid) {
      return response.json({
        success: false,
        error: 'Please select product ID.',
      });
    }

    if (!buyer) {
      return response.json({
        success: false,
        error: 'Please select address to be buyer.',
      });
    }

    const unlocked = await unlockAccount(buyer, password);
    if (!unlocked) {
      return response.json({
        success: false,
        error: 'Please type correct account password.',
      });
    }

    await buyProduct(pid, buyer);
    return response.json({
      success: true,
      error: null,
    });
  } catch (error) {
    return response.json({
      success: false,
      error: error.message,
    });
  }
});

app.post('/products/:pid', async (request, response) => {
  try {
    	const { pid } = request.params;
      const result = await getProduct(pid);
      return response.json({
         success: true,
         data: result,
         error: null,
      });
  }
  catch (error) {
    return response.json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(appPort, () => console.log(`Ecommerce server is running! it is listening on port ${appPort}...`));
