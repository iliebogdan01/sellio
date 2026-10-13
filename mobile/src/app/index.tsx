import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";

type Listing = {
  id: number;
  title: string;
  price: number | string;
  location: string | null;
  category: string | null;
  description: string | null;
  image: string | null;
  images: string[] | null;
  user_id: string;
  created_at: string;
  promoted: boolean | null;
  promoted_until: string | null;
};

const categories = [
  "All",
  "Cars & Vehicles",
  "Property",
  "Electronics",
  "Fashion",
  "Home & Garden",
  "Gaming",
  "Baby & Kids",
  "Services",
];

function isPromoted(listing: Listing) {
  if (!listing.promoted) return false;

  if (!listing.promoted_until) return true;

  return (
    new Date(listing.promoted_until).getTime() >
    Date.now()
  );
}

function getImage(listing: Listing) {
  if (listing.image) return listing.image;

  if (listing.images?.length) {
    return listing.images[0];
  }

  return null;
}

export default function HomeScreen() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] =
    useState("All");

  useEffect(() => {
    loadData();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      setUser(currentUser ?? null);

      const { data, error } = await supabase
        .from("listings")
        .select(
          "id,title,price,location,category,description,image,images,user_id,created_at,promoted,promoted_until"
        )
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.log(
          "LISTINGS ERROR:",
          error.message
        );
        return;
      }

      setListings((data as Listing[]) || []);
    } catch (error) {
      console.log("LOAD ERROR:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function refreshListings() {
    setRefreshing(true);
    await loadData();
  }

  function openAuth() {
    router.push("/auth");
  }

  function openSell() {
    console.log("SELL BUTTON PRESSED");
    router.push("/sell");
  }

  const filteredListings = useMemo(() => {
    const searchText = search
      .trim()
      .toLowerCase();

    return listings.filter((listing) => {
      const categoryMatch =
        selectedCategory === "All" ||
        listing.category === selectedCategory;

      const searchMatch =
        !searchText ||
        listing.title
          .toLowerCase()
          .includes(searchText) ||
        (listing.description || "")
          .toLowerCase()
          .includes(searchText) ||
        (listing.location || "")
          .toLowerCase()
          .includes(searchText);

      return categoryMatch && searchMatch;
    });
  }, [
    listings,
    search,
    selectedCategory,
  ]);

  const promotedListings =
    filteredListings.filter(isPromoted);

  const latestListings =
    filteredListings.filter(
      (listing) => !isPromoted(listing)
    );

  function renderListing({
    item,
  }: {
    item: Listing;
  }) {
    const image = getImage(item);

    return (
      <TouchableOpacity
        style={styles.listingCard}
        activeOpacity={0.8}
        onPress={() =>
          console.log(
            "LISTING PRESSED:",
            item.id
          )
        }
      >
        <View style={styles.imageContainer}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.listingImage}
            />
          ) : (
            <View style={styles.noImage}>
              <Text style={styles.noImageIcon}>
                📷
              </Text>
              <Text style={styles.noImageText}>
                No photo
              </Text>
            </View>
          )}

          {isPromoted(item) && (
            <View style={styles.promotedBadge}>
              <Text
                style={
                  styles.promotedBadgeText
                }
              >
                PROMOTED
              </Text>
            </View>
          )}
        </View>

        <View style={styles.listingInfo}>
          <Text
            style={styles.listingTitle}
            numberOfLines={2}
          >
            {item.title}
          </Text>

          <Text style={styles.price}>
            £
            {Number(item.price).toLocaleString(
              "en-GB"
            )}
          </Text>

          <Text
            style={styles.location}
            numberOfLines={1}
          >
            📍{" "}
            {item.location ||
              "Location not specified"}
          </Text>

          {item.category && (
            <Text style={styles.categorySmall}>
              {item.category}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  function renderHeader() {
    return (
      <>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() =>
              router.replace("/")
            }
          >
            <Text style={styles.logo}>
              Sellio
            </Text>
          </TouchableOpacity>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.loginButton}
              onPress={openAuth}
            >
              <Text
                style={styles.loginButtonText}
              >
                {user ? "Account" : "Login"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sellButton}
              onPress={openSell}
            >
              <Text
                style={styles.sellButtonText}
              >
                + Sell
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>
            Buy. Sell. Discover.
          </Text>

          <Text style={styles.heroSubtitle}>
            Find great deals or sell your items
            on Sellio.
          </Text>

          <View
            style={styles.searchContainer}
          >
            <Text style={styles.searchIcon}>
              ⌕
            </Text>

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search listings..."
              placeholderTextColor="#888888"
              style={styles.searchInput}
            />
          </View>
        </View>

        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>
            Categories
          </Text>

          <FlatList
            horizontal
            data={categories}
            keyExtractor={(item) => item}
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.categoryList
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  selectedCategory === item &&
                    styles.categoryButtonActive,
                ]}
                onPress={() =>
                  setSelectedCategory(item)
                }
              >
                <Text
                  style={[
                    styles.categoryButtonText,
                    selectedCategory === item &&
                      styles.categoryButtonTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {promotedListings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Promoted listings
            </Text>

            <FlatList
              horizontal
              data={promotedListings}
              keyExtractor={(item) =>
                String(item.id)
              }
              showsHorizontalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.horizontalListings
              }
              renderItem={renderListing}
            />
          </View>
        )}

        <View style={styles.latestHeader}>
          <Text style={styles.sectionTitle}>
            Latest listings
          </Text>

          <Text style={styles.countText}>
            {latestListings.length}
          </Text>
        </View>
      </>
    );
  }

  if (loading) {
    return (
      <SafeAreaView
        style={styles.loadingScreen}
      >
        <Text style={styles.loadingLogo}>
          Sellio
        </Text>

        <ActivityIndicator
          size="large"
          color="#000000"
        />

        <Text style={styles.loadingText}>
          Loading listings...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={latestListings}
        keyExtractor={(item) =>
          String(item.id)
        }
        renderItem={renderListing}
        numColumns={2}
        columnWrapperStyle={
          styles.columnWrapper
        }
        contentContainerStyle={
          styles.listContent
        }
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={refreshListings}
        ListHeaderComponent={
          renderHeader
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>
              🔎
            </Text>

            <Text style={styles.emptyTitle}>
              No listings found
            </Text>

            <Text style={styles.emptyText}>
              Try another search or category.
            </Text>
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={styles.footerLogo}>
              Sellio
            </Text>

            <Text style={styles.footerText}>
              Buy. Sell. Discover.
            </Text>

            <Text
              style={
                styles.footerCopyright
              }
            >
              © {new Date().getFullYear()} Sellio
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  listContent: {
    paddingBottom: 30,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingLogo: {
    fontSize: 42,
    fontWeight: "900",
    color: "#000000",
    marginBottom: 20,
  },

  loadingText: {
    marginTop: 10,
    color: "#777777",
  },

  header: {
    minHeight: 70,
    paddingHorizontal: 16,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#e8e8e8",
  },

  logo: {
    fontSize: 31,
    fontWeight: "900",
    color: "#000000",
  },

  headerButtons: {
    flexDirection: "row",
    gap: 8,
  },

  loginButton: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#dddddd",
    justifyContent: "center",
  },

  loginButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111111",
  },

  sellButton: {
    height: 40,
    paddingHorizontal: 15,
    borderRadius: 9,
    backgroundColor: "#000000",
    justifyContent: "center",
  },

  sellButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
  },

  hero: {
    backgroundColor: "#ffffff",
    padding: 16,
    paddingTop: 28,
    paddingBottom: 22,
  },

  heroTitle: {
    fontSize: 30,
    fontWeight: "900",
    color: "#111111",
  },

  heroSubtitle: {
    marginTop: 7,
    fontSize: 14,
    color: "#777777",
  },

  searchContainer: {
    height: 52,
    marginTop: 20,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#dddddd",
    backgroundColor: "#f8f8f8",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
  },

  searchIcon: {
    fontSize: 25,
    marginRight: 8,
    color: "#555555",
  },

  searchInput: {
    flex: 1,
    color: "#111111",
    fontSize: 15,
  },

  categorySection: {
    backgroundColor: "#ffffff",
    paddingBottom: 18,
  },

  sectionTitle: {
    paddingHorizontal: 16,
    fontSize: 20,
    fontWeight: "900",
    color: "#111111",
  },

  categoryList: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 8,
  },

  categoryButton: {
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 9,
    backgroundColor: "#f2f2f2",
  },

  categoryButtonActive: {
    backgroundColor: "#000000",
  },

  categoryButtonText: {
    color: "#444444",
    fontSize: 12,
    fontWeight: "700",
  },

  categoryButtonTextActive: {
    color: "#ffffff",
  },

  section: {
    marginTop: 12,
    paddingTop: 18,
    paddingBottom: 8,
    backgroundColor: "#ffffff",
  },

  horizontalListings: {
    paddingHorizontal: 16,
    paddingTop: 13,
    gap: 12,
  },

  latestHeader: {
    marginTop: 12,
    paddingTop: 18,
    paddingBottom: 14,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  countText: {
    paddingRight: 16,
    fontSize: 13,
    color: "#888888",
  },

  columnWrapper: {
    paddingHorizontal: 16,
    gap: 12,
  },

  listingCard: {
    flex: 1,
    maxWidth: "50%",
    marginBottom: 12,
    backgroundColor: "#ffffff",
    borderRadius: 13,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e4e4e4",
  },

  imageContainer: {
    height: 145,
    backgroundColor: "#eeeeee",
  },

  listingImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },

  noImage: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  noImageIcon: {
    fontSize: 26,
  },

  noImageText: {
    marginTop: 5,
    color: "#888888",
  },

  promotedBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 5,
    backgroundColor: "#000000",
  },

  promotedBadgeText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "900",
  },

  listingInfo: {
    padding: 11,
  },

  listingTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111111",
    minHeight: 38,
  },

  price: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "900",
    color: "#000000",
  },

  location: {
    marginTop: 7,
    fontSize: 11,
    color: "#777777",
  },

  categorySmall: {
    marginTop: 7,
    fontSize: 10,
    color: "#999999",
  },

  emptyContainer: {
    minHeight: 260,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyIcon: {
    fontSize: 42,
  },

  emptyTitle: {
    marginTop: 12,
    fontSize: 19,
    fontWeight: "900",
  },

  emptyText: {
    marginTop: 6,
    color: "#888888",
  },

  footer: {
    marginTop: 10,
    backgroundColor: "#111111",
    alignItems: "center",
    paddingVertical: 30,
  },

  footerLogo: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "900",
  },

  footerText: {
    marginTop: 5,
    color: "#aaaaaa",
  },

  footerCopyright: {
    marginTop: 20,
    color: "#777777",
    fontSize: 11,
  },
});