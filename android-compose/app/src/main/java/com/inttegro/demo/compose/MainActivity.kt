package com.inttegro.demo.compose

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.animation.core.animateColorAsState
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.ShoppingBag
import androidx.compose.material.icons.outlined.LocalShipping
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.tooling.preview.Preview
import androidx.compose.ui.unit.dp
import com.inttegro.payments.InttegroPaymentSheet
import com.inttegro.payments.PaymentSheetAdapter
import com.inttegro.payments.PaymentSheetConfiguration
import com.inttegro.payments.PaymentSheetResult
import com.inttegro.payments.PaymentSheetSession
import java.time.Instant

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { KoraTheme { KoraMarketScreen() } }
    }
}

private data class Finish(val name: String, val color: Color)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun KoraMarketScreen() {
    val finishes = remember {
        listOf(
            Finish("Sunrise clay", Color(0xFFB84831)),
            Finish("Night earth", Color(0xFF302A28)),
            Finish("River sand", Color(0xFFC2A77D)),
        )
    }
    var favorite by remember { mutableStateOf(false) }
    var showMenu by remember { mutableStateOf(false) }
    var selectedCategory by remember { mutableStateOf("New in") }
    var selectedFinish by remember { mutableStateOf(finishes.first()) }
    var showPaymentSheet by remember { mutableStateOf(false) }
    var outcome by remember { mutableStateOf<String?>(null) }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.surfaceContainerLowest,
        topBar = {
            TopAppBar(
                title = { Text("Kora Market", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    Box {
                        IconButton(onClick = { showMenu = true }) { Icon(Icons.Default.Menu, "Open menu") }
                        DropdownMenu(expanded = showMenu, onDismissRequest = { showMenu = false }) {
                            listOf("New in", "Table", "Textiles", "Objects").forEach { category ->
                                DropdownMenuItem(
                                    text = { Text(category) },
                                    onClick = {
                                        selectedCategory = category
                                        showMenu = false
                                    },
                                )
                            }
                        }
                    }
                },
                actions = {
                    IconButton(onClick = { showPaymentSheet = true }) {
                        Icon(Icons.Default.ShoppingBag, "Shopping bag, one item")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surfaceContainerLowest),
            )
        },
        bottomBar = {
            Surface(shadowElevation = 14.dp, tonalElevation = 3.dp) {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 13.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(18.dp),
                ) {
                    Column {
                        Text("Total", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Text("GHS 50.00", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    }
                    Button(onClick = { showPaymentSheet = true }, modifier = Modifier.weight(1f).height(52.dp)) {
                        Text("Pay with Inttegro", fontWeight = FontWeight.SemiBold)
                    }
                }
            }
        },
    ) { padding ->
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(padding),
            verticalArrangement = Arrangement.spacedBy(0.dp),
        ) {
            item {
                LazyRow(
                    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 20.dp, vertical = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    items(listOf("New in", "Table", "Textiles", "Objects")) { category ->
                        FilterChip(selected = category == selectedCategory, onClick = { selectedCategory = category }, label = { Text(category) })
                    }
                }
            }
            item {
                Box(modifier = Modifier.fillMaxWidth().aspectRatio(1.04f)) {
                    Image(
                        painter = painterResource(R.drawable.kora_dawn_brew),
                        contentDescription = "Terracotta Dawn Brew Set with a pour-over and cup",
                        contentScale = ContentScale.Crop,
                        modifier = Modifier.fillMaxSize(),
                    )
                    Surface(
                        modifier = Modifier.align(Alignment.TopStart).padding(18.dp),
                        shape = RoundedCornerShape(50),
                        color = MaterialTheme.colorScheme.surface.copy(alpha = .86f),
                        tonalElevation = 4.dp,
                    ) { Text("Small batch", modifier = Modifier.padding(horizontal = 14.dp, vertical = 9.dp), style = MaterialTheme.typography.labelMedium) }
                    IconButton(
                        onClick = { favorite = !favorite },
                        modifier = Modifier.align(Alignment.TopEnd).padding(14.dp).background(MaterialTheme.colorScheme.surface.copy(alpha = .86f), CircleShape),
                    ) { Icon(if (favorite) Icons.Default.Favorite else Icons.Default.FavoriteBorder, if (favorite) "Remove from favorites" else "Add to favorites", tint = if (favorite) Color(0xFFB84831) else MaterialTheme.colorScheme.onSurface) }
                }
            }
            item {
                Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(22.dp)) {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text("Dawn Brew Set", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f), maxLines = 1, overflow = TextOverflow.Ellipsis)
                            Text("GHS 50", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                        }
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("★ 4.9", color = Color(0xFFA65D16), fontWeight = FontWeight.SemiBold)
                            Text("240 reviews", color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Spacer(Modifier.weight(1f))
                            Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF26855B), modifier = Modifier.size(17.dp))
                            Text("Ready to ship", color = Color(0xFF26855B), style = MaterialTheme.typography.labelMedium)
                        }
                    }
                    Text("A sculptural pour-over and cup, shaped by hand in Ho for slower mornings and more considered rituals.", color = MaterialTheme.colorScheme.onSurfaceVariant, style = MaterialTheme.typography.bodyLarge)
                    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row { Text("Finish", fontWeight = FontWeight.Bold); Spacer(Modifier.weight(1f)); Text(selectedFinish.name, color = MaterialTheme.colorScheme.onSurfaceVariant) }
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            finishes.forEach { finish ->
                                val border by animateColorAsState(if (finish == selectedFinish) MaterialTheme.colorScheme.onSurface else Color.Transparent)
                                Box(
                                    modifier = Modifier.size(44.dp).clip(CircleShape).clickable { selectedFinish = finish }
                                        .semantics { contentDescription = finish.name; selected = finish == selectedFinish }
                                        .background(finish.color).padding(3.dp),
                                ) { Surface(modifier = Modifier.fillMaxSize(), shape = CircleShape, color = Color.Transparent, border = BorderStroke(2.dp, border)) {} }
                            }
                        }
                    }
                    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceContainer)) {
                        Column(modifier = Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text("Made by Ama Ofori", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                            Text("Every piece keeps the subtle marks of its making. Local clay is fired to a food-safe finish and packed without plastic.", color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(10.dp)) { Icon(Icons.Outlined.LocalShipping, null); Text("Delivery across Ghana in 2–4 days", fontWeight = FontWeight.SemiBold) }
                        }
                    }
                    outcome?.let {
                        Surface(shape = RoundedCornerShape(16.dp), color = MaterialTheme.colorScheme.secondaryContainer) {
                            Text(it, modifier = Modifier.padding(16.dp), color = MaterialTheme.colorScheme.onSecondaryContainer)
                        }
                    }
                }
            }
        }
    }

    if (showPaymentSheet) {
        InttegroPaymentSheet(
            configuration = PaymentSheetConfiguration(
                orderId = "or_demo_compose",
                returnUrl = "inttegro-demo://payment-return",
            ),
            adapter = DemoPreviewAdapter,
            onDismissRequest = { showPaymentSheet = false },
            onResult = { result ->
                showPaymentSheet = false
                outcome = when (result) {
                    is PaymentSheetResult.Completed -> "Payment submitted. We’ll verify it before fulfillment."
                    PaymentSheetResult.Canceled -> "Checkout paused. Your Dawn Brew Set is still in the bag."
                    is PaymentSheetResult.Failed -> "Payment unavailable (${result.error.code})."
                }
            },
        )
    }
}

private object DemoPreviewAdapter : PaymentSheetAdapter {
    override suspend fun retrieve(configuration: PaymentSheetConfiguration) = PaymentSheetSession(
        id = "ps_demo_compose",
        merchant = PaymentSheetSession.Merchant("Kora Market", "Secure checkout powered by Inttegro"),
        amount = PaymentSheetSession.Money(5_000, "GHS"),
        paymentMethods = listOf(
            PaymentSheetSession.PaymentMethod("mobile-money", PaymentSheetSession.PaymentMethod.Kind.MOBILE_MONEY, "Mobile money", "Choose a provider after continuing"),
            PaymentSheetSession.PaymentMethod("card", PaymentSheetSession.PaymentMethod.Kind.CARD, "Card", "Visa, Mastercard, or Amex"),
        ),
        expiresAt = Instant.now().plusSeconds(15 * 60),
    )

    override suspend fun confirm(configuration: PaymentSheetConfiguration, session: PaymentSheetSession, paymentMethod: PaymentSheetSession.PaymentMethod) = PaymentSheetResult.Completed("pay_demo")
}

@Preview(showBackground = true)
@Composable
private fun KoraPreview() { KoraTheme { KoraMarketScreen() } }

private val KoraLightColors = lightColorScheme(
    primary = Color(0xFF183C32), onPrimary = Color.White, secondary = Color(0xFFB84831),
    surface = Color(0xFFFFFBF3), surfaceContainer = Color(0xFFF0E9DD), surfaceContainerLowest = Color(0xFFF8F3E9),
)
private val KoraDarkColors = darkColorScheme(primary = Color(0xFFA8D8C8), secondary = Color(0xFFFFB5A0))

@Composable
private fun KoraTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = if (isSystemInDarkTheme()) KoraDarkColors else KoraLightColors, content = content)
}
