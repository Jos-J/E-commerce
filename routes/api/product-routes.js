const router = require('express').Router();
const { Product, Category, Tag, ProductTag } = require('../../models');

// The `/api/products` endpoint

// get all products
router.get('/', async (req, res) => {
  // find all products
  
  try {
    const products = await Product.findAll({
      include: [Category, Tag]
    });
    res.status(200).json(products);
  } catch (err) {
    req.status(500).json(err);
  }
});

// get one product
router.get('/:id', async (req, res) => {
  // find a single product by its `id`
try {
  const product = await Product.findByPk(req.params.id, {
    include: [Category, Tag]
  });
  
  if (!product) {
    res.status(404).json({ message:'Product can not be found'});
    return;
  }

  res.status.apply(200).json(product);
} catch (err) {
  res.status(500).json(err);
}
});



// create new product 
router.post('/', async (req, res) => {
  try {
    // Create the product
    const product = await Product.create(req.body);

    // Check if there are product tags
    if (req.body.tagIds && req.body.tagIds.length) {
      // Create an array of productTag objects
      const productTagIdArr = req.body.tagIds.map((tag_id) => {
        return {
          product_id: product.id,
          tag_id,
        };
      });

      // Bulk create product tags in the ProductTag model
      await ProductTag.bulkCreate(productTagIdArr);
    }

    // Respond with the created product
    res.status(200).json(product);
  } catch (err) {
    console.log(err);
    res.status(400).json(err);
  }
});


// update product
router.put('/:id', (req, res) => {
  // update product data
  Product.update(req.body, {
    where: {
      id: req.params.id,
    },
  })
    .then((product) => {
      if (req.body.tagIds && req.body.tagIds.length) {

        ProductTag.findAll({
          where: { product_id: req.params.id }
        }).then((productTags) => {
          // create filtered list of new tag_ids
          const productTagIds = productTags.map(({ tag_id }) => tag_id);
          const newProductTags = req.body.tagIds
            .filter((tag_id) => !productTagIds.includes(tag_id))
            .map((tag_id) => {
              return {
                product_id: req.params.id,
                tag_id,
              };
            });

          // figure out which ones to remove
          const productTagsToRemove = productTags
            .filter(({ tag_id }) => !req.body.tagIds.includes(tag_id))
            .map(({ id }) => id);
          // run both actions
          return Promise.all([
            ProductTag.destroy({ where: { id: productTagsToRemove } }),
            ProductTag.bulkCreate(newProductTags),
          ]);
        });
      }

      return res.json(product);
    })
    .catch((err) => {
      // console.log(err);
      res.status(400).json(err);
    });
});

router.delete('/:id', async (req, res) => {
  // delete one product by its `id` value
  try {
    const deleteProduct = await Product.destroy({
      where: {
        id: req.params.id,
      }
    })
    if (!deleteProduct) {
      res.status(404).json({ message: 'Product not found with that Id'});
      return;
    }
    res.status(200).json(deleteProduct);
  } catch (err) {
    res.status(400).json(err);
  }
});


module.exports = router;
